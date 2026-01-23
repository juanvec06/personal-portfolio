import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  /**
   * Señal reactiva que indica si el dispositivo es móvil.
   */
  public isMobile = signal<boolean>(false);

  constructor() {
    this.detectMobileDevice();
  }

  /**
   * Detecta si el dispositivo es móvil usando userAgentData o userAgent como fallback.
   * Siempre verifica también el userAgent tradicional para mayor compatibilidad.
   */
  private detectMobileDevice(): void {
    try {
      // Primero verificar con userAgent tradicional (más confiable)
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android',
        'webos',
        'iphone',
        'ipad',
        'ipod',
        'blackberry',   
        'windows phone',
        'opera mini',
        'mobile',
        'redmi',
        'vivo',
        'oppo',
        'huawei',
        'samsung',
        'xiaomi'
      ];
      const isMobileByUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      // Usar userAgentData si está disponible (API moderna) como verificación adicional
      let isMobileByUserAgentData = false;
      if ('userAgentData' in navigator && (navigator as any).userAgentData) {
        try {
          const userAgentData = (navigator as any).userAgentData;
          isMobileByUserAgentData = userAgentData.mobile === true;
        } catch (e) {
          // Si falla userAgentData, ignoramos el error
          console.warn('Error accessing userAgentData:', e);
        }
      }
      
      // Es móvil si cualquiera de los dos métodos lo detecta
      this.isMobile.set(isMobileByUserAgent || isMobileByUserAgentData);
    } catch (error) {
      // En caso de error, intentar detectar por ancho de pantalla
      console.warn('Error detecting mobile device:', error);
      this.isMobile.set(window.innerWidth <= 768);
    }
  }
}
