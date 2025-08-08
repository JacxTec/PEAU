import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonCard,IonCardContent,IonCardHeader,IonCardTitle,IonCardSubtitle,  IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView  } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Keyboard } from '@capacitor/keyboard';

Keyboard.setScroll({ isDisabled: false });
import { triangle, ellipse, square, peopleCircle, peopleOutline, swapHorizontal,swapHorizontalOutline, receiptOutline, bagHandleOutline, bagOutline, bagAddOutline } from 'ionicons/icons';
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonCard,IonCardContent,IonCardHeader,IonCardTitle,IonCardSubtitle,  IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    addIcons({ triangle, ellipse, square ,peopleCircle ,peopleOutline,swapHorizontal,swapHorizontalOutline,receiptOutline,bagHandleOutline, bagOutline, bagAddOutline });
  }
}
