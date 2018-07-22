import { Action } from '@ngrx/store';

export enum SharedActionTypes {
  DOWNLOAD_FILE = '[SHARED] Download file',
}

export class DownloadFile implements Action {
  readonly type = SharedActionTypes.DOWNLOAD_FILE;

  constructor(public payload: any) {
  }
}

export type SharedActionAll =
  | DownloadFile;
