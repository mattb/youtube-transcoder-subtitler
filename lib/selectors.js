import { createSelector } from 'reselect';

const jobIdsSelector = state => state.jobqueue.job_ids;

export const workingSelector = createSelector(
  jobIdsSelector,
  job_ids => job_ids.length > 0
);

export const currentJobIdSelector = createSelector(
  jobIdsSelector,
  job_ids => job_ids[0]
);
