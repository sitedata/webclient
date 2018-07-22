import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { DownloadFile, SharedActionTypes } from '../actions/shared.actions';
import { tap } from 'rxjs/operators/tap';
import { map } from 'rxjs/operators/map';
import { HttpClient } from '@angular/common/http';
import { ResponseContentType } from '@angular/http';

@Injectable()
export class SharedEffects {
  constructor(private actions: Actions,
              private http: HttpClient) {}

  @Effect({ dispatch: false })
  public downloadFile: Observable<any> = this.actions.pipe(
    ofType(SharedActionTypes.DOWNLOAD_FILE),
    map((action: DownloadFile) => action.payload),
    tap((payload) => {

      this.http
        .get(payload)
        .map((res: any) => {
          return {
            data: res.blob()
          };
        })
        .subscribe(res => {
          console.log('start download:', res);
          const url = window.URL.createObjectURL(res.data);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.setAttribute('style', 'display: none');
          a.href = url;
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove(); // remove the element
        }, error => {
          console.log('download error:', JSON.stringify(error));
        }, () => {
          console.log('Completed file download.');
        });
    })
  );
}
