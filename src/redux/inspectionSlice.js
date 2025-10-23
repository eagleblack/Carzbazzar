// store/inspectionsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

//
// ───────────────────────────────
// Async Thunks
// ───────────────────────────────
//

// Create a new inspection
export const createInspection = createAsyncThunk(
  "inspections/createInspection",
  async ({ userId, owner, rcFront, rcBack }, thunkAPI) => {
    try {
      const inspectionId = `ins_${Date.now()}`;
      const apptId = Date.now().toString().slice(-10);

      const docRef = await firestore().collection("inspections").add({
        userId,
        inspectionId,
        apptId,
        ownerName: owner.name,
        ownerAddress: owner.address,
        phoneNumber: owner.phone,
        rcFront,   // ✅ save RC Front
        rcBack,    // ✅ save RC Back
        status: "inspecting",
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        sections: {},
      });

      return {
        firestoreId: docRef.id,
        inspectionId,
        apptId,
        owner,
        rcFront,   // ✅ return them too
        rcBack,
        status: "inspecting",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: {},
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);


// Delete an inspection
export const deleteInspection = createAsyncThunk(
  "inspections/deleteInspection",
  async ({ firestoreId, inspectionId }, thunkAPI) => {
    try {
      if (firestoreId) {
        await firestore().collection("inspections").doc(firestoreId).delete();
      }
      return inspectionId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// Mark inspection completed
export const completeInspection = createAsyncThunk(
  "inspections/completeInspection",
  async (inspectionId, thunkAPI) => {
    const { inspections } = thunkAPI.getState();
    const inspection = inspections.byId[inspectionId];
    if (!inspection) {
      return thunkAPI.rejectWithValue("Inspection not found in state");
    }

    try {
      if (inspection.firestoreId) {
        await firestore()
          .collection("inspections")
          .doc(inspection.firestoreId)
          .update({
            status: "completed",
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
      }
      return inspectionId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

//
// ───────────────────────────────
// Slice
// ───────────────────────────────
//
const inspectionsSlice = createSlice({
  name: "inspections",
  initialState: {
    byId: {},        // keyed by inspectionId
    allIds: [],      // list of inspectionIds
    uploadQueue: [], // image/video upload tasks
  },
  reducers: {
    //
    // ─── Inspections ───
    //
    addInspectionSync(state, action) {
      const ins = action.payload;
      state.byId[ins.inspectionId] = ins;
      if (!state.allIds.includes(ins.inspectionId)) {
        state.allIds.unshift(ins.inspectionId);
      }
    },

   setSection(state, action) {
  const { inspectionId, sectionKey, data } = action.payload;
  const inspection = state.byId[inspectionId];
  if (!inspection) return;

  if (!inspection.sections) inspection.sections = {};
  
  // Merge with existing section data
  inspection.sections[sectionKey] = {
    ...inspection.sections[sectionKey],
    ...sanitize(data),
  };

  inspection.updatedAt = new Date().toISOString();
},
    setAll(state, action) {
      state.byId = {};
      state.allIds = [];
      action.payload.forEach((ins) => {
        state.byId[ins.inspectionId] = ins;
        state.allIds.push(ins.inspectionId);
      });
    },

    //
    // ─── Upload Queue ───
    //
    addImageLocal(state, action) {
      const { inspectionId, image } = action.payload;
      const idx = state.uploadQueue.findIndex((q) => q.id === image.id);

      const newItem = {
        inspectionId,
        ...image,
        status: "pending",
        attempts: 0,
        progress: 0,
        uploaded: false,
      };

      if (idx >= 0) {
        state.uploadQueue[idx] = newItem;
      } else {
        state.uploadQueue.push(newItem);
      }

      // Ensure section exists in state
      const inspection = state.byId[inspectionId];
      if (!inspection.sections) inspection.sections = {};
      inspection.sections[image.sectionKey] = {
        image: {
          type: image.type || "image",
          localPath: image.localPath,
          uploaded: false,
          remark: image.remark || "",
        },
      };
    },

    markImageUploading(state, action) {
      const item = state.uploadQueue.find((q) => q.id === action.payload);
      if (item) {
        item.status = "uploading";
        item.attempts += 1;
      }
    },

    markImageUploaded(state, action) {
      const item = state.uploadQueue.find((q) => q.id === action.payload);
      if (item) {
        item.status = "uploaded";
        item.uploaded = true;
      }
    },

    markImageFailed(state, action) {
      const item = state.uploadQueue.find((q) => q.id === action.payload);
      if (item) item.status = "failed";
    },

    setUploadProgress(state, action) {
      const { id, progress } = action.payload;
      const item = state.uploadQueue.find((q) => q.id === id);
      if (item) item.progress = progress;
    },

    removeFromQueue(state, action) {
      state.uploadQueue = state.uploadQueue.filter((q) => q.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createInspection.fulfilled, (state, action) => {
        const ins = action.payload;
        state.byId[ins.inspectionId] = ins;
        if (!state.allIds.includes(ins.inspectionId)) {
          state.allIds.unshift(ins.inspectionId);
        }
      })
      .addCase(deleteInspection.fulfilled, (state, action) => {
        const inspectionId = action.payload;
        delete state.byId[inspectionId];
        state.allIds = state.allIds.filter((id) => id !== inspectionId);
      })
      .addCase(completeInspection.fulfilled, (state, action) => {
        const inspectionId = action.payload;
        delete state.byId[inspectionId];
        state.allIds = state.allIds.filter((id) => id !== inspectionId);
      });
  },
});

export const {
  addInspectionSync,
  setSection,
  setAll,
  addImageLocal,
  markImageUploading,
  markImageUploaded,
  markImageFailed,
  setUploadProgress,
  removeFromQueue,
} = inspectionsSlice.actions;

export default inspectionsSlice.reducer;

//
// ───────────────────────────────
// Thunks (Custom Logic)
// ───────────────────────────────
//

// Upload a single image/video
export const uploadImage = (queueItem) => async (dispatch, getState) => {
  const { id, localPath, inspectionId, sectionKey, remark, type = "image" } = queueItem;

  const inspection = getState().inspections.byId[inspectionId];
  if (!inspection) return null;

  try {
    dispatch(markImageUploading(id));

    const ext = type === "video" ? "mp4" : "jpg";
    const filename = `${inspectionId}/${sectionKey}/${id}.${ext}`;
    const ref = storage().ref(filename);

    const task = ref.putFile(localPath);
    task.on("state_changed", (snap) => {
      const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      dispatch(setUploadProgress({ id, progress }));
    });

    // ✅ Wait for upload to complete
    await task;

    const downloadURL = await ref.getDownloadURL();

    dispatch(markImageUploaded(id));

    // ✅ Update Redux
    dispatch(
      setSection({
        inspectionId,
        sectionKey,
        data: {
          image: { type, localPath, url: downloadURL, uploaded: true, remark },
        },
      })
    );

    // ✅ Update Firestore
    await firestore().collection("inspections").doc(inspection.firestoreId).update({
      [`sections.${sectionKey}.image`]: {
        type,
        url: downloadURL,
        uploaded: true,
        remark,
        uploadedAt: new Date().toISOString(),
      },
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return downloadURL; // ✅ so handleSubmit can use it
  } catch (err) {
    console.error("Upload failed:", err);
    dispatch(markImageFailed(id));
    throw err; // ✅ bubble up to caller
  }
};


// Process all items in the upload queue
export const processUploadQueue = () => async (dispatch, getState) => {
  const items = getState().inspections.uploadQueue.filter((q) =>
    ["pending", "failed", "uploading"].includes(q.status)
  );

  for (const item of items) {
    await dispatch(uploadImage(item));
  }
};

// Save non-file section (choices, remarks)
export const saveSectionToFirestore =
  ({ inspectionId, sectionKey, remark }) =>
  async (dispatch, getState) => {
    const inspection = getState().inspections.byId[inspectionId];
    if (!inspection) return;

    try {
      const payload = {
        image: { type: "choice", remark, uploaded: true },
      };

      // Update Redux
      dispatch(setSection({ inspectionId, sectionKey, data: payload }));

      // Update Firestore
      await firestore().collection("inspections").doc(inspection.firestoreId).update({
        [`sections.${sectionKey}.image`]: payload.image,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to save section:", err);
    }
  };
// store/inspectionsSlice.js

// Save Car Details Section
export const saveCarDetailsSection = ({ inspectionId, data }) => 
  async (dispatch, getState) => {
    const inspection = getState().inspections.byId[inspectionId];
    if (!inspection) return;

    try {
      const cleanData = sanitize(data);

      // ✅ Remove image field if present
      const { image, ...restData } = cleanData;

      // ✅ Update Redux (still includes everything, even image if needed)
      dispatch(setSection({ 
        inspectionId, 
        sectionKey: "carDetails", 
        data: cleanData 
      }));

      // ✅ Build dot-notation updates for Firestore (excluding image)
      const carDetailsUpdates = Object.entries(restData).reduce(
        (acc, [key, value]) => {
          acc[`sections.carDetails.${key}`] = value;
          return acc;
        },
        {}
      );

      await firestore()
        .collection("inspections")
        .doc(inspection.firestoreId)
        .update({
          ...carDetailsUpdates,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log("Car details merged successfully (image unchanged) for inspection:", inspectionId);
    } catch (err) {
      console.error("Failed to save car details:", err);
    }
  };



  // Helper to remove undefined values recursively
const sanitize = (obj) => {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
};
