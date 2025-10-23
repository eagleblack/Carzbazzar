// store/inspectionProgressSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inspections: {}, // ✅ keyed by inspectionId
};

const inspectionProgressSlice = createSlice({
  name: 'inspectionProgress',
  initialState,
  reducers: {
    markSectionCompleted: (state, action) => {
      const { inspectionId, sectionKey } = action.payload;

      if (!state.inspections[inspectionId]) {
        // ✅ initialize with all sections false
        state.inspections[inspectionId] = {
          completedSections: {
            carDetails: false,
            exteriorTyres: true,
            electricalInterior: false,
            engineTransmission: false,
            steeringSuspension: false,
            airConditioning: false,
            summary: true,
            imageReview: true,
          },
        };
      }

      state.inspections[inspectionId].completedSections[sectionKey] = true;
    },

    resetInspectionProgress: (state, action) => {
      const { inspectionId } = action.payload;
      if (inspectionId) {
        delete state.inspections[inspectionId]; // reset just one inspection
      } else {
        state.inspections = {}; // reset all
      }
    },
  },
});

export const { markSectionCompleted, resetInspectionProgress } =
  inspectionProgressSlice.actions;
export default inspectionProgressSlice.reducer;
