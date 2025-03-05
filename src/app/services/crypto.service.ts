import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as CryptoJS  from 'crypto-js';


@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private static secretKey = environment.cryptoKey;

  constructor() { }

  // Encriptar texto con AES
  public static encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.secretKey).toString();
  }

  // Desencriptar texto con AES
  public static decrypt(encryptedValue: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
