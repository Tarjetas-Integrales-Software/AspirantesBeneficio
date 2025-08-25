import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { BeneficiarioSsasService } from '../../services/CRUD/beneficiarioSsas.service';
import { BeneficiarioSsas, The48456 } from './interfaces/BeneficiarioSsas.interface';
import { CatalogoSsas } from './interfaces/CatalogoSsas.interface';
import { IDSPermitidos } from './interfaces/IdsPermitidos.interface';

@Component({
  selector: 'consulta-ssas',
  imports: [
    CommonModule,
    MatInputModule,
    MatTableModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './consulta-ssas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaSsasComponent implements OnInit {

  consultaForm: FormGroup;
  isLoading = signal(false);
  beneficiarioData = signal<The48456 | null>(null);
  beneficiarioId = signal<string | null>(null);
  hasError = signal(false);
  errorMessage = signal('');
  catalogoSsas = signal<CatalogoSsas | null>(null);
  idsPermitidos = signal<IDSPermitidos | null>(null);

  constructor(
    private beneficiarioSsasService: BeneficiarioSsasService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.consultaForm = this.fb.group({
      curp: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]]
    });
  }

  ngOnInit(): void {
    this.cargarCatalogoSsas();
    this.getIdsPermitidos();
  }

  cargarCatalogoSsas(): void {
    this.beneficiarioSsasService.consultaCatalogoSsas().subscribe({
      next: (catalogo: CatalogoSsas) => {
        this.catalogoSsas.set(catalogo);
        console.log('Catálogo SSAS cargado:', catalogo);
      },
      error: (error) => {
        console.error('Error al cargar catálogo SSAS:', error);
      }
    });
  }

  getIdsPermitidos(): void {
    this.beneficiarioSsasService.getIdsPermitidos().subscribe({
      next: (response: IDSPermitidos) => {
        this.idsPermitidos.set(response);
        console.log('IDs permitidos:', response);
      },
      error: (error) => {
        console.error('Error al obtener IDs permitidos:', error);
      }
    });
  }

  onConsultar(): void {
    if (this.consultaForm.valid) {
      const curp = this.consultaForm.get('curp')?.value.toUpperCase();
      this.buscarBeneficiario(curp);
      this.registrarConsulta(curp);
    } else {
      this.consultaForm.markAllAsTouched();
    }
  }

  buscarBeneficiario(curp: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    this.beneficiarioData.set(null);
    this.beneficiarioId.set(null);

    this.beneficiarioSsasService.getBeneficiarioSsas(curp).subscribe({
      next: (response: BeneficiarioSsas) => {
        console.log('Respuesta completa:', response);

        if (response.data && Object.keys(response.data).length > 0) {
          // Obtener el primer (y único) beneficiario de la respuesta
          const beneficiarioId = Object.keys(response.data)[0];
          const beneficiario = response.data[beneficiarioId as keyof typeof response.data];

          // Validar si el status_beneficiario_id está permitido
          const statusBeneficiarioId = beneficiario.SSAS?.status_beneficiario_id;
          console.log('Status Beneficiario ID:', statusBeneficiarioId);
          console.log('IDs Permitidos:', this.getIdsPermitidosArray());

          if (statusBeneficiarioId && !this.isStatusBeneficiarioPermitido(statusBeneficiarioId)) {
            // Si el status no está permitido, mostrar mensaje de error
            console.log('Status no permitido, ocultando información');
            this.beneficiarioData.set(null);
            this.beneficiarioId.set(null);
            this.hasError.set(true);
            this.errorMessage.set('El beneficiario consultado no tiene un status permitido para mostrar la información.');
          } else {
            // Si el status está permitido o no existe, mostrar los datos
            console.log('Status permitido, mostrando información');
            this.beneficiarioData.set(beneficiario);
            this.beneficiarioId.set(beneficiarioId);
            console.log('Beneficiario encontrado:', beneficiario);
          }
        } else {
          this.beneficiarioData.set(null);
          this.beneficiarioId.set(null);
          this.hasError.set(true);
          this.errorMessage.set('No se encontraron datos para esta CURP');
        }

        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al buscar beneficiario:', error);
        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Error al consultar los datos. Verifique la CURP e intente nuevamente.');
        this.beneficiarioData.set(null);
        this.beneficiarioId.set(null);
        this.cdr.detectChanges();
      }
    });
  }

  registrarConsulta(curp: string): void {
    this.beneficiarioSsasService.registerConsultaSsas(curp).subscribe({
      next: (response) => {
        console.log('Registro de consulta exitoso:', response);
      },
      error: (error) => {
        console.error('Error al registrar consulta:', error);
      }
    });
  }

  // Métodos auxiliares para obtener datos de manera segura
  getIdentityData() {
    return this.beneficiarioData()?.identity || null;
  }

  getContactData() {
    return this.beneficiarioData()?.contact || null;
  }

  getAddressData() {
    return this.beneficiarioData()?.address || null;
  }

  getSSASData() {
    return this.beneficiarioData()?.SSAS || null;
  }

  getStudentsData() {
    return this.beneficiarioData()?.students || null;
  }

  getTISAData() {
    return this.beneficiarioData()?.TISA || null;
  }

  // Método para obtener el ID del beneficiario
  getBeneficiarioId() {
    return this.beneficiarioId();
  }

  // Método para validar si el status_beneficiario_id está permitido
  isStatusBeneficiarioPermitido(statusId: number): boolean {
    const idsPermitidos = this.idsPermitidos();
    if (!idsPermitidos?.data) {
      return false;
    }

    const configRefrendo = idsPermitidos.data.find(
      item => item.clave === 'config_permite_refrendo'
    );

    if (!configRefrendo?.valor) {
      return false;
    }

    const valoresPermitidos = configRefrendo.valor.split(',').map(v => parseInt(v.trim()));
    return valoresPermitidos.includes(statusId);
  }

  // Método para obtener los IDs permitidos (útil para debugging)
  getIdsPermitidosArray(): number[] {
    const idsPermitidos = this.idsPermitidos();
    if (!idsPermitidos?.data) {
      return [];
    }

    const configRefrendo = idsPermitidos.data.find(
      item => item.clave === 'config_permite_refrendo'
    );

    if (!configRefrendo?.valor) {
      return [];
    }

    return configRefrendo.valor.split(',').map(v => parseInt(v.trim()));
  }

  // Métodos para obtener textos descriptivos desde el catálogo
  getModalidadSsasTexto(): string {
    const modalidadId = this.getSSASData()?.modalidad_id;
    const catalogo = this.catalogoSsas();

    if (!modalidadId || !catalogo?.data?.modalidades_ssas) {
      return 'N/A';
    }

    const modalidad = catalogo.data.modalidades_ssas.find(
      m => m.Valor === modalidadId.toString()
    );

    return modalidad?.OpcionGeneral || `Modalidad ${modalidadId}`;
  }

  getStatusBeneficiarioTexto(): string {
    const statusId = this.getSSASData()?.status_beneficiario_id;
    const catalogo = this.catalogoSsas();

    if (!statusId || !catalogo?.data?.status_beneficiario_ssas) {
      return 'N/A';
    }

    const status = catalogo.data.status_beneficiario_ssas.find(
      s => s.Valor === statusId.toString()
    );

    return status?.OpcionGeneral || `Status ${statusId}`;
  }


  // Método para convertir CURP a mayúsculas mientras se escribe
  onCurpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.consultaForm.get('curp')?.setValue(input.value);
  }

  // Validación para mostrar errores en el campo CURP
  getCurpError(): string {
    const curpControl = this.consultaForm.get('curp');
    if (curpControl?.hasError('required')) {
      return 'La CURP es obligatoria';
    }
    if (curpControl?.hasError('minlength') || curpControl?.hasError('maxlength')) {
      return 'La CURP debe tener exactamente 18 caracteres';
    }
    return '';
  }

}
