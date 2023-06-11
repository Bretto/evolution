import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {SceneComponent} from './evolution/scene.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SceneComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
