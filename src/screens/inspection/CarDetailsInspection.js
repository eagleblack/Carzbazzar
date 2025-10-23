import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,

  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { saveSectionToFirestore, addImageLocal, processUploadQueue, saveCarDetailsSection, uploadImage } from '../../redux/inspectionSlice';

import { COLORS } from '../../styles/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const CarDetailsInspection = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const inspectionId = route.params?.inspection.inspectionId;
  const inspection = useSelector(
    (state) => state.inspections.byId[inspectionId]
  );


const inspections = useSelector(state => state.inspections);
  // Use a single state object to prevent multiple re-renders
  const [state, setState] = useState({
    formData: {
      name: '',
      model: '',
      yearOfManufacturing: '',
      numberOfOwners: '',
      duplicateKey: '',
      km: '',
      fuelType: '',
      regState: '',
      regCity: '',
      insuranceType: '',
      insuranceExpiry: '',
      rcAvailability: '',
      roadTaxPaid: '',
      roadTaxDate: '',
      cngLpgFitment: '',
      registrationNumber: '',
      rto: '',
      city: '',
      rtoNocIssued: '',
      inspectionAtDoorstep: '',
      branch: '',
      toBeScrapped: '',
      chassisNumber: '',
      embossing: '',
      manufacturingMonth: '',
      registrationYear: '',
      registrationMonth: '',
      fitnessUpto: '',
      rcCondition: '',
      mismatchInRc: '',
    },
    mainImage: null,
    validationErrors: {},
    hasAttemptedSubmit: false,
    isSaving: false,
  });

    const [uploadStatus, setUploadStatus] = useState(null);     // 'pending'|'uploading'|'uploaded'|'failed'|null
const [uploadProgress, setUploadProgress] = useState(0);    // 0..100
const uploadPromiseRef = useRef(null);                      // { resolve, reject } for awaiting upload

// Derive main upload queue item from redux using the current mainImage id
const mainImageId = state.mainImage?.id;
const mainUploadItem = useSelector((s) =>
  s.inspections.uploadQueue.find(
    (q) => q.inspectionId === inspectionId && q.id === mainImageId
  )
);

useEffect(() => {
  if (!mainUploadItem) {
    setUploadStatus(null);
    setUploadProgress(0);
    return;
  }

  setUploadStatus(mainUploadItem.status);
  setUploadProgress(mainUploadItem.progress ?? 0);

  // If someone is awaiting upload, resolve/reject the promise when status changes
  if (uploadPromiseRef.current) {
    if (mainUploadItem.status === 'uploaded') {
      uploadPromiseRef.current.resolve(mainUploadItem);
      uploadPromiseRef.current = null;
    } else if (mainUploadItem.status === 'failed') {
      uploadPromiseRef.current.reject(new Error('Upload failed'));
      uploadPromiseRef.current = null;
    }
  }
}, [mainUploadItem]);


  // Refs to prevent TextInput from losing focus
  const inputRefs = useRef({});

  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!state.isSaving) return;
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation, state.isSaving]);

  // Load existing data
useEffect(() => {
  if (inspection?.sections?.carDetails) {
    const sanitized = Object.fromEntries(
      Object.entries(inspection.sections.carDetails).map(([k, v]) => [
        k,
        v == null ? '' : String(v),
      ])
    );

    setState(prev => ({
      ...prev,
      formData: sanitized,
      // ✅ if inspection already has a mainImage, keep it
      mainImage: inspection.sections.carDetails.mainImage || prev.mainImage,
    }));
  }
}, [inspection?.sections?.carDetails]); // rerun when Redux updates


  // Update field function that doesn't cause re-renders
  const updateField = (fieldName, value) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [fieldName]: value || '',
      },
    }));
  };

  // Blur handler
  const handleBlur = (fieldName) => {
    if (state.hasAttemptedSubmit && state.validationErrors[fieldName]) {
      setState(prev => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [fieldName]: false,
        },
      }));
    }
  };

const validateForm = () => {
  const { formData, mainImage } = state;
  const errors = {};
  const emptyFields = [];

  // Define only the required fields
  const requiredFields = [
    'name',
    'model',
    'yearOfManufacturing',
    'mainImage', // We'll handle this separately but include here for alert
  ];

  // Check text fields
  requiredFields.forEach((key) => {
    if (key === 'mainImage') return; // Skip here, check later
    const value = formData[key];
    if (!value || value.trim() === '') {
      errors[key] = true;
      emptyFields.push(key);
    } else {
      errors[key] = false;
    }
  });

  // Check main image
  if (!mainImage || (!mainImage.localPath && !mainImage.url)) {
    errors.mainImage = true;
    emptyFields.push('mainImage');
  } else {
    errors.mainImage = false;
  }

  // Update state with validation results
  setState((prev) => ({
    ...prev,
    validationErrors: errors,
    hasAttemptedSubmit: true,
  }));

  return {
    isValid: emptyFields.length === 0,
    emptyFields,
  };
};
const waitForUpload = (timeoutMs = 120000) => {
  return new Promise((resolve, reject) => {
    // If no queue item found -> reject immediately
    if (!mainUploadItem) {
      return reject(new Error('No upload item found'));
    }

    // If already uploaded or failed, resolve/reject immediately
    if (mainUploadItem.status === 'uploaded') return resolve(mainUploadItem);
    if (mainUploadItem.status === 'failed') return reject(new Error('Upload already failed'));

    // Otherwise set the promise ref; the useEffect above will resolve/reject it
    uploadPromiseRef.current = { resolve, reject };

    // Safety timeout
    const to = setTimeout(() => {
      if (uploadPromiseRef.current) {
        uploadPromiseRef.current.reject(new Error('Upload timed out'));
        uploadPromiseRef.current = null;
      }
    }, timeoutMs);

    // make sure to clear timeout on settle
    const prevResolve = resolve;
    const prevReject = reject;
    const wrappedResolve = (val) => { clearTimeout(to); prevResolve(val); };
    const wrappedReject = (err) => { clearTimeout(to); prevReject(err); };

    uploadPromiseRef.current = { resolve: wrappedResolve, reject: wrappedReject };
  });
};

  const pickMainImage = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera & storage permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const imageAsset = result.assets[0];
        const imageObj = {
          id: `main_${Date.now()}`,
          localPath: imageAsset.uri,
          sectionKey: 'carDetails',
           remark: "",
        };

        setState(prev => ({
          ...prev,
          mainImage: imageObj,
        }));

        dispatch(
          addImageLocal({
            inspectionId,
            image: imageObj,
          })
        );
        dispatch(processUploadQueue());
      }
    } catch (err) {
      console.log('Camera error:', err);
      Alert.alert('Error', 'Could not open camera: ' + err.message);
    }
  };
const handleSubmit = async () => {
  const validation = validateForm();
  if (!validation.isValid) {
    Alert.alert('Error', 'Please fill all required fields');
    return;
  }

  setState(prev => ({ ...prev, isSaving: true }));

  try {
    // If there's a main image, ensure it's uploaded first
    if (state.mainImage) {
      const uploadItem = inspections.uploadQueue.find(
        q => q.inspectionId === inspectionId && q.id === state.mainImage.id
      );

      if (uploadItem && uploadItem.status !== 'uploaded') {
        // Kick off queue (in case it's pending / failed)
        dispatch(processUploadQueue());

        // Wait here until upload success or failure
        try {
          await waitForUpload(); // resolves when uploaded, rejects on failed/timeout
        } catch (uploadErr) {
          // Show a friendly alert and stop saving
          Alert.alert('Upload Failed', 'Main image upload failed. Please retry.');
          setState(prev => ({ ...prev, isSaving: false }));
          return;
        }
      }
    }

    // Save section only after upload success
    await dispatch(saveCarDetailsSection({
      inspectionId,
      data: {
        ...state.formData,
        mainImage: state.mainImage,
      },
    }));

    Alert.alert('Success', 'Car details saved!');
       route.params?.onComplete?.();
          navigation.goBack()
  } catch (err) {
    Alert.alert('Error', err.message || 'Failed to save');
  } finally {
    setState(prev => ({ ...prev, isSaving: false }));
  }
};



  // Create a stable TextInput component
  const createTextInput = (fieldName, label, placeholder, keyboardType = 'default') => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {label} <Text style={styles.requiredIndicator}>*</Text>
        </Text>
       <TextInput
  ref={(ref) => {
    if (ref) {
      inputRefs.current[fieldName] = ref;
    }
  }}
  style={[
    styles.textInput,
    state.hasAttemptedSubmit && state.validationErrors[fieldName] && styles.errorField
  ]}
  value={state.formData[fieldName]}
  onChangeText={(value) => updateField(fieldName, value.toUpperCase())}  // 🔹 force uppercase
  onBlur={() => handleBlur(fieldName)}
  placeholder={placeholder}
  keyboardType={keyboardType}
  placeholderTextColor={COLORS.gray}
  blurOnSubmit={false}
  returnKeyType="next"
  multiline={false}
  autoCorrect={false}
  autoCapitalize="characters"   // optional, makes keyboard suggest caps
  selectTextOnFocus={false}
  caretHidden={false}
/>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => !state.isSaving && navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Details Inspection</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
        // Prevent keyboard from dismissing
        keyboardDismissMode="none"
      >
        <View style={styles.content}>
          {/* Main Car Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Main Car Image</Text>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                state.hasAttemptedSubmit && state.validationErrors.mainImage && styles.errorField
              ]}
              onPress={pickMainImage}
              disabled={uploadStatus === 'uploading'}
            >
              <Text>
                {state.mainImage ? 'Image Selected ✅' : 'Select Main Car Image'}
              </Text>
            </TouchableOpacity>
          </View>
          {state.mainImage && (
  <View style={{ marginTop: 8 }}>
    {uploadStatus === 'uploading' && (
      <Text style={{ color: 'orange' }}>Uploading... {uploadProgress ?? 0}%</Text>
    )}

    {uploadStatus === 'failed' && (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <Text style={{ color: 'red', fontWeight: '600' }}>Upload failed ❌</Text>

        <TouchableOpacity
          onPress={() => dispatch(processUploadQueue())}
          style={{ marginLeft: 12, paddingVertical: 6, paddingHorizontal: 10 }}
        >
          <Text style={{ color: '#1e3a8a', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )}

    {uploadStatus === 'uploaded' && (
      <Text style={{ color: 'green' }}>Image uploaded ✅</Text>
    )}

    {(!uploadStatus || uploadStatus === 'pending') && (
      <Text style={{ color: '#6b7280' }}>Ready to upload</Text>
    )}
  </View>
)}

          {/* Basic Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            {createTextInput('name', 'Name', 'Enter car name')}
            {createTextInput('model', 'Model', 'Enter car model')}
            {createTextInput('yearOfManufacturing', 'Year Of Manufacturing', 'Enter manufacturing year')}
            {createTextInput('numberOfOwners', 'No. Of Owner(S)', 'Enter number of owners', 'numeric')}
            {createTextInput('duplicateKey', 'Duplicate Key', 'Yes/No')}
            {createTextInput('km', 'KM', 'Enter kilometers', 'numeric')}
            {createTextInput('fuelType', 'Fuel Type', 'Enter fuel type')}
            {createTextInput('regState', 'Reg. State', 'Enter registration state')}
            {createTextInput('regCity', 'Reg. City', 'Enter registration city')}
          </View>

          {/* Insurance Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Details</Text>
            {createTextInput('insuranceType', 'Insurance Type', 'Enter insurance type')}
            {createTextInput('insuranceExpiry', 'Insurance Expiry', 'Enter expiry date')}
          </View>

          {/* RC Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RC Details</Text>
            {createTextInput('rcAvailability', 'RC Availability', 'Original/Duplicate')}
            {createTextInput('roadTaxPaid', 'Road Tax Paid', 'Enter road tax status')}
            {createTextInput('roadTaxDate', 'Road Tax Date (Validity)', 'Enter validity date')}
            {createTextInput('cngLpgFitment', 'CNG/LPG Fitment In RC', 'Yes/No/N/A')}
          </View>

          {/* Registration Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registration Details</Text>
            {createTextInput('registrationNumber', 'Registration Number', 'Enter registration number')}
            {createTextInput('rto', 'RTO', 'Enter RTO details')}
            {createTextInput('city', 'City', 'Enter city')}
            {createTextInput('rtoNocIssued', 'RTO NOC Issued', 'Yes/No')}
            {createTextInput('inspectionAtDoorstep', 'Inspection At Doorstep', 'Enter inspection status')}
            {createTextInput('branch', 'Branch', 'Enter branch details')}
            {createTextInput('toBeScrapped', 'To Be Scrapped', 'Yes/No')}
            {createTextInput('chassisNumber', 'Chassis Number', 'Enter chassis number')}
            {createTextInput('embossing', 'Embossing', 'Enter embossing status')}
            {createTextInput('manufacturingMonth', 'Manufacturing Month', 'Enter manufacturing month')}
            {createTextInput('registrationYear', 'Registration Year', 'Enter registration year', 'numeric')}
            {createTextInput('registrationMonth', 'Registration Month', 'Enter registration month')}
            {createTextInput('fitnessUpto', 'Fitness Upto', 'Enter fitness validity')}
            {createTextInput('rcCondition', 'RC Condition', 'Enter RC condition')}
            {createTextInput('mismatchInRc', 'Mismatch In RC', 'Enter mismatch status')}
          </View>

          {/* Note Section */}
          <View style={styles.noteSection}>
            <Text style={styles.noteText}>
              PLEASE REVIEW DETAILS AND SUBMIT
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, state.isSaving && { opacity: 0.6 }]}
          disabled={state.isSaving}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {state.isSaving ? 'Saving...' : 'Submit Inspection'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.white },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
  },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  requiredIndicator: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  errorField: {
    borderColor: '#ef4444',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  noteSection: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginTop: 16,
  },
  noteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  imagePicker: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

export default CarDetailsInspection;