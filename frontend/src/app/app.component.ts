import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { NgForm } from '@angular/forms';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { ServerService } from './service/server.service';
import { Server } from './interface/server';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse | null>> | undefined;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse|null>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor(private serverService: ServerService) {}

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
    .pipe(
      map(response => {
        console.log(response);
        this.dataSubject.next(response);
        return {
          dataState: DataState.LOADED_STATE,
          appData: {...response, data: { servers: response.data.servers?.reverse() }},

        }
      }),
      startWith({
        dataState: DataState.LOADING_STATE
      }),
      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error})
      })
    )
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
    .pipe(
      map(response => {
        const index = this.dataSubject.value!.data.servers!.findIndex(
          server => server.id === response.data!.server!.id)
        console.log(response);
        console.log(index);
        this.dataSubject.value!.data!.servers![index] = response.data!.server!;
        this.filterSubject.next('');
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value
        }
      }),
      startWith({
        dataState: DataState.LOADED_STATE,
        appData: this.dataSubject.value
      }),
      catchError((error: string) => {
        this.filterSubject.next('');
        return of({ dataState: DataState.ERROR_STATE, error})
      })
    )
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
    .pipe(
      map(response => {
        this.dataSubject.next({
          ...response, data : {
            servers: this.dataSubject.value?.data.servers?.filter(
              s => {
                return s.id !== server.id
              }
            )
          }
        })
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value
        }
      }),
      startWith({
        dataState: DataState.LOADED_STATE,
        appData: this.dataSubject.value
      }),
      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error})
      })
    )
  }
  // it is not function which call the backend 
  filterServers(status: Status): void {
    console.log(status)
    this.appState$ = this.serverService.filter$(status, this.dataSubject!.value!)
      .pipe(
        map(response => {
          // this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: response };
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          // this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value)
      .pipe(
        map(response => {
          this.dataSubject.next(
            {...response, data: { servers: [response.data!.server!, ...this.dataSubject.value?.data!.servers!]}}
          )
          document.getElementById('closeModal')?.click();
          this.isLoading.next(false);
          serverForm.resetForm( { status: this.Status.SERVER_DOWN });
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value };
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          // this.notifier.onError(error);
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  printReport(): void {
    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('servers');
    let tableHtml = tableSelect?.outerHTML.replace(/ /g, '%20');
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink); 
  }
}


