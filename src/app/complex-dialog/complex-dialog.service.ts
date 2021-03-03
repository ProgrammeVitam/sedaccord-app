import {Injectable, InjectionToken, Injector} from '@angular/core';
import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal, ComponentType} from '@angular/cdk/portal';
import {ArchiveTransferAddComponent} from '../archive-transfer-add/archive-transfer-add.component';

// TODO move?
export const ADD_DIALOG_REF = new InjectionToken<DialogReference<ArchiveTransferAddComponent>>('dialogRef');
export const FILE_DETAIL_SIDENAV_REF = new InjectionToken<DialogReference<ArchiveTransferAddComponent>>('fileDetailSidenavRef');

interface ComplexDialogConfig {
  hasBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
}

const DEFAULT_CONFIG: ComplexDialogConfig = {
  hasBackdrop: true,
  closeOnBackdropClick: false
};

export class DialogReference<T> {
  overlayRef: OverlayRef | null;
  componentInstance: T | null;

  constructor() {
    this.overlayRef = null;
    this.componentInstance = null;
  }

  close(): void {
    this.overlayRef!.dispose();
    this.componentInstance = null;
  }
}

@Injectable({providedIn: 'root'})
export class ComplexDialogService<T> {

  constructor(private overlay: Overlay) {
  }

  open(
    component: ComponentType<T>,
    injectionToken: InjectionToken<DialogReference<T>>,
    config: ComplexDialogConfig = {}
  ): DialogReference<T> {
    // Override default configuration
    const dialogConfig = {...DEFAULT_CONFIG, ...config};

    const dialogRef = new DialogReference<T>();

    // Returns an OverlayRef which is a PortalHost
    const overlayRef = this.createOverlay(dialogRef, dialogConfig);
    dialogRef.overlayRef = overlayRef;

    // Create ComponentPortal that can be attached to a PortalHost
    const complexDialogPortal = new ComponentPortal(
      component,
      null,
      this.createInjector(injectionToken, dialogRef)
    );

    // Attach ComponentPortal to PortalHost
    const componentInstance = overlayRef.attach(complexDialogPortal);
    dialogRef.componentInstance = componentInstance.instance;

    return dialogRef;
  }

  private getOverlayConfig(config: ComplexDialogConfig): OverlayConfig {
    const positionStrategy = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();

    const overlayConfig = new OverlayConfig({
      hasBackdrop: config.hasBackdrop,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy
    });

    return overlayConfig;
  }

  private createInjector(injectionToken: InjectionToken<DialogReference<T>>, dialogRef: DialogReference<T>): Injector {
    const injector: Injector = Injector.create({
      providers: [{provide: injectionToken, useValue: dialogRef}]
    });
    return injector;
  }

  private createOverlay(dialogRef: DialogReference<T>, config: ComplexDialogConfig): OverlayRef {
    // Returns an OverlayRef which is a PortalHost
    const overlayRef = this.overlay.create(this.getOverlayConfig(config));

    if (config.closeOnBackdropClick) {
      overlayRef.backdropClick().subscribe(_ => dialogRef.close());
    }

    return overlayRef;
  }
}
