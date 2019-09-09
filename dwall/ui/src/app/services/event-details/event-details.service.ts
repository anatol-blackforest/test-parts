import { Injectable, ViewContainerRef, ReflectiveInjector, ComponentFactoryResolver, ComponentRef } from '@angular/core';

import { EventDetailsComponent } from '../../components/event-details/event-details.component';

@Injectable()
export class EventDetailsService {

  constructor (
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }
  
  public createEventDetails (viewContainerRef: ViewContainerRef, modelInput: any): ComponentRef<any> {
    let factory = this.componentFactoryResolver.resolveComponentFactory(EventDetailsComponent);
    let injector = ReflectiveInjector.fromResolvedProviders([], viewContainerRef.parentInjector);
    let component = factory.create(injector);
    component.instance.data = modelInput;
    viewContainerRef.insert(component.hostView);
    return component;
  }

}