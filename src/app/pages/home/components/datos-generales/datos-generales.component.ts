import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CodigosPostalesService } from '../../../../services/CRUD/codigos-postales.service';
import { NetworkStatusService } from '../../../../services/network-status.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ModalidadesService } from '../../../../services/CRUD/modalidades.service';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  AbstractControl,
  ValidationErrors,
  FormControl,
} from '@angular/forms';
import { Aspirante, AspirantesBeneficioService } from '../../../../services/CRUD/aspirantes-beneficio.service';
import { GradosService } from '../../../../services/CRUD/grados.service';
import { TiposCarrerasService } from '../../../../services/CRUD/tipos-carreras.service';
import { CarrerasService } from '../../../../services/CRUD/carreras.service';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { CurpPrevioRegisto, CurpsRegistradasService } from '../../../../services/CRUD/curps-registradas.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ConfiguracionesService } from '../../../../services/CRUD/configuraciones.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'datosGeneralesComponent',
  providers: [provideNativeDateAdapter()],
  imports: [
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInput,
    MatDatepickerModule,
    MatCardModule,
    MatAutocompleteModule,
  ],
  templateUrl: './datos-generales.component.html',
  styleUrl: './datos-generales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatosGeneralesComponent implements OnInit {

  private fb = inject(FormBuilder);
  colonias: any[] = [];
  modalidades: any[] = [];

  grados: any[] = [];
  grado: string = '';

  tipos_carreras: any[] = [];
  tipo_carrera: string = '';

  carreras: any[] = [];

  tipoAsentamiento: string = '';
  tipoZona: string = '';

  allCodigosPostales: any[] = [];

  // estos son las que se utilizan para mandar el formulario
  gradoNombre: string = '';
  tipoCarreraNombre: string = '';
  carreraNombre: string = '';

  editar: boolean = false;  // Variable para saber si se está editando un registro
  editAspirante: Aspirante = {
    id: 0,
    id_modalidad: 0,
    curp: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    fecha_nacimiento: '',
    email: '',
    municipio: '',
    cp: '',
    colonia: '',
    tipo_zona: '',
    tipo_asentamiento: '',
    domicilio: '',
    grado: '',
    tipo_carrera: '',
    carrera: '',
    com_obs: '',
    estado: '',
    ciudad: '',
    fecha_evento: '',
    created_id: 0,
    created_at: ''
  };       // ID del registro a editar
  modulo_actual: string | null = null;

  @ViewChild('input') codigoPostal?: ElementRef<HTMLInputElement>;
  //options: string[] = [];
  filteredOptions: any[] = [];

  private lastCurpAutoFilled?: string;

  constructor(private networkStatusService: NetworkStatusService
    , private codigosPostalesService: CodigosPostalesService
    , private modalidadesService: ModalidadesService
    , private aspirantesBeneficioService: AspirantesBeneficioService
    , private gradosService: GradosService
    , private tiposCarrerasService: TiposCarrerasService
    , private carrerasService: CarrerasService
    , private curpsRegistradasService: CurpsRegistradasService
    , private configuracionesService: ConfiguracionesService
  ) {
    this.filteredOptions = this.codigosPostales.slice();
  }

  myForm: FormGroup = this.fb.group({
    id_modalidad: ['', [Validators.required, Validators.minLength(5)]],
    curp: ['BADN980406HJCSVS', [
      Validators.required,
      Validators.minLength(18),
      Validators.pattern(/^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0\d|1[0-2])(?:[0-2]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/)
    ], this.editar ? null : this.curpAsyncValidator.bind(this)],
    nombre: ['', [Validators.required, Validators.minLength(1)]],
    apellido_paterno: ['', [Validators.required, Validators.minLength(1)]],
    apellido_materno: ['', [Validators.required, Validators.minLength(1)]],
    telefono: ['', [Validators.required, Validators.minLength(10)]],
    fecha_nacimiento: ['', [Validators.required, Validators.minLength(10)]],
    email: ['',],
    municipio: ['', [Validators.required, Validators.minLength(2)]],
    cp: ['', [Validators.required, Validators.minLength(5)]],
    colonia: ['', [Validators.required, Validators.minLength(2)]],
    tipo_zona: ['',],
    tipo_asentamiento: ['',],
    domicilio: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    grado: ['',],
    tipo_carrera: ['',],
    carrera: ['',],
    com_obs: ['', [Validators.maxLength(500)]],
  });

  filter(): void {
    const filterValue = this.codigoPostal?.nativeElement?.value.toLowerCase() || '';
    this.filteredOptions = this.codigosPostales.filter(o => o.cp.toString().includes(filterValue));
  }

  curpAsyncValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (this.editar) return of(null);
    const raw = (control.value || '').toString().trim().toUpperCase();
    if (raw.length !== 18) return of(null);

    return this.curpsRegistradasService.getAspirantesBeneficioPorCurpPrevioRegistro(raw).pipe(
      map((response: CurpPrevioRegisto) => {
        const registro = response?.data?.[0];
        if (!registro) return null;

        if (registro.beneficiado === '0') {
          if (this.lastCurpAutoFilled !== raw) {
            this.lastCurpAutoFilled = raw;
            Swal.fire({
              icon: 'info',
              title: 'Registro previo sin beneficio',
              text: 'Este usuario ya tiene un registro, pero no fue beneficiado. Serás redireccionad@ al menú de editar registro para tomar la foto y hacer las correcciones necesarias.',
              confirmButtonText: 'Ir a editar'
            }).then(() => {
              this.router.navigate(['/inicio/editar', registro.id]);
            });
          } else {
            this.router.navigate(['/inicio/editar', registro.id]);
          }
          return null;
        }
        return { curpBeneficiado: true };
      }),
      tap((result: ValidationErrors | null) => {
        if (result && (result as any).curpBeneficiado) {
          Swal.fire({
            icon: 'warning',
            title: 'CURP con beneficio',
            text: 'Esta CURP ya cuenta con un beneficio registrado.',
            confirmButtonText: 'Aceptar'
          });
        }
      }),
      catchError(err => {
        console.error('Error validando CURP:', err);
        return of(null);
      })
    );
  }

  /**
   * Convierte una fecha string a Date object manejando correctamente la zona horaria
   * Para evitar problemas de desplazamiento de días por zona horaria
   */
  private parseLocalDate(dateString: string): Date {
    if (!dateString) return new Date();

    // Si viene en formato "YYYY-MM-DD" (solo fecha)
    if (dateString.length === 10 && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(n => parseInt(n, 10));
      return new Date(year, month - 1, day); // month - 1 porque Date usa índice 0-11 para meses
    }

    // Si viene en formato "YYYY-MM-DD HH:mm:ss" (fecha con hora)
    if (dateString.includes(' ')) {
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-').map(n => parseInt(n, 10));
      const [hour, minute, second] = timePart.split(':').map(n => parseInt(n, 10));
      return new Date(year, month - 1, day, hour, minute, second);
    }

    // Fallback para otros formatos
    return new Date(dateString);
  }

  private parseNombreCompleto(raw: string): { nombre: string; apellido_paterno: string; apellido_materno: string } {
    const PARTICULAS = new Set(['DE', 'DEL', 'LA', 'LAS', 'LO', 'LOS', 'Y', 'VAN', 'VON', 'MC', 'MAC', 'SAN', 'SANTA']);
    const tokens = (raw || '').trim().split(/\s+/).filter(t => t).map(t => t.toUpperCase());
    let nombre = ''; let apellido_paterno = ''; let apellido_materno = '';
    if (!tokens.length) return { nombre, apellido_paterno, apellido_materno };
    if (tokens.length === 1) return { nombre: tokens[0], apellido_paterno, apellido_materno };
    if (tokens.length === 2) return { nombre: tokens[0], apellido_paterno, apellido_materno: tokens[1] };

    const work = [...tokens];
    // Materno
    const maternoParts: string[] = [work.pop()!];
    while (work.length && PARTICULAS.has(work[work.length - 1])) maternoParts.unshift(work.pop()!);
    apellido_materno = maternoParts.join(' ');
    // Paterno
    if (work.length) {
      const paternoParts: string[] = [work.pop()!];
      while (work.length && PARTICULAS.has(work[work.length - 1])) paternoParts.unshift(work.pop()!);
      apellido_paterno = paternoParts.join(' ');
    }
    nombre = work.join(' ');
    return { nombre: nombre.trim(), apellido_paterno: apellido_paterno.trim(), apellido_materno: apellido_materno.trim() };
  }

  isValidField(fieldName: string): boolean | null {
    return (this.myForm.controls[fieldName].errors && this.myForm.controls[fieldName].touched);
  }

  getFieldError(fieldName: string): string | null {
    if (!this.myForm.controls[fieldName].errors) return null;

    const errors = this.myForm.controls[fieldName].errors ?? {};

    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return 'Este campo es requerido';
        case 'email':
          return 'El email no es válido';
        case 'minlength':
          return `Este campo debe tener al menos ${errors[key].requiredLength} caracteres`;
        case 'pattern':
          return 'El formato de la CURP no es correcto';
        case 'curpBeneficiado':
          return 'Esta CURP ya cuenta con un beneficio';
      }
    }
    return null;
  }

  selectedValue: string = '';
  selectedCar: string = '';

  codigosPostales: any[] = [];

  municipios: any[] = [];
  municipio: string = '';

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    this.modulo_actual = this.configuracionesService.getSelectedValueModu();
    if (!this.modulo_actual) {
      let timerInterval: NodeJS.Timeout;
      Swal.fire({
        icon: 'info',
        title: 'Aún no seleccionás un módulo...',
        html: 'Por favor, seleccioné un módulo y vuelva a intentar <br> Redirigiendo en <b></b> segundos.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const container = Swal.getHtmlContainer();
          if (!container) return; // Verifica que no sea null
          const b = container.querySelector('b') as HTMLElement | null;
          if (!b) return; // Verifica que 'b' exista

          timerInterval = setInterval(() => {
            const timerLeft = Swal.getTimerLeft(); // Puede ser undefined
            if (typeof timerLeft === 'number') { // Verifica si es un número
              b.textContent = Math.ceil(timerLeft / 1000).toString();
            }
          }, 1000);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
          this.router.navigateByUrl('/inicio/modulo-operaciones');
        }
      });
    }
    const online = this.networkStatusService.checkConnection();

    if (online) this.syncDataBase();
    this.getMunicipios();
    this.getModalidades();
    this.getGrados();
    this.getTiposCarreras();
    this.getCarreras();
    this.getColoniasByCP();

    // Llama al método para inhabilitar los inputs
    if (!this.router.url.includes('editar')) {
      this.disableInputs();
      return;
    } else {
      this.editar = true;
      this.disabledInputsEdit();

      this.activatedRoute.params
        .pipe(
          switchMap(({ id }) => this.aspirantesBeneficioService.getAspiranteBeneficioId(id)),
        ).subscribe(aspirante => {
          debugger
          this.editAspirante = aspirante.data;

          if (!aspirante) {
            return this.router.navigateByUrl('/');
          }

          const { nombre, apellido_paterno, apellido_materno } = this.parseNombreCompleto(aspirante.data.nombre_completo || '');

          // Obtener los IDs correspondientes a los nombres
          const selectedGrado = this.grados.find(grado => grado.nombre === aspirante.data.grado);
          const selectedTipoCarrera = this.tipos_carreras.find(tipoCarrera => tipoCarrera.nombre === aspirante.data.tipo_carrera);
          const selectedCarrera = this.carreras.find(carrera => carrera.nombre === aspirante.data.carrera);
          const selectedModalidad = this.modalidades.find(modalidad => modalidad.id === parseInt(aspirante.data.id_modalidad, 10));
          const selectedCP = this.allCodigosPostales.find(cp => cp.cp === aspirante.data.cp);

          this.getCodigosPostales({ municipio: aspirante.data.municipio });

          // Establecer los campos correspondientes en el formulario
          this.myForm.reset({
            ...aspirante.data,
            nombre: (aspirante.data.nombre || nombre).toUpperCase(),
            apellido_paterno: (aspirante.data.apellido_paterno || apellido_paterno).toUpperCase(),
            apellido_materno: (aspirante.data.apellido_materno || apellido_materno).toUpperCase(),
            fecha_nacimiento: aspirante.data.fecha_nacimiento ? new Date(aspirante.data.fecha_nacimiento + 'T00:00:00') : '',
            grado: selectedGrado ? selectedGrado.id : '',
            tipo_carrera: selectedTipoCarrera ? selectedTipoCarrera.id : '',
            carrera: selectedCarrera ? selectedCarrera.nombre : '',
            id_modalidad: selectedModalidad ? parseInt(selectedModalidad.id, 10) : '',
            cp: aspirante.data.cp
          });

          return;
        });
    }
  }

  disableInputs(): void {
    this.myForm.get('grado')?.disable();
    this.myForm.get('tipo_carrera')?.disable();
    this.myForm.get('carrera')?.disable();
    this.myForm.get('tipo_zona')?.disable();
    this.myForm.get('tipo_asentamiento')?.disable();
  }

  disabledInputsEdit(): void {
    this.myForm.get('curp')?.disable();
    this.myForm.get('grado')?.enable();
    this.myForm.get('tipo_carrera')?.enable();
    this.myForm.get('carrera')?.enable();
  }

  getGrados(): void {
    this.gradosService.consultarGrados()
      .then((grados) => {
        this.grados = grados;
      })
      .catch((error) => console.error('Error al obtener grados:', error));
  }

  getTiposCarreras(): void {
    this.tiposCarrerasService.consultarTiposCarreras()
      .then((tipos_carreras) => {
        this.tipos_carreras = tipos_carreras;
      })
      .catch((error) => console.error('Error al obtener tipos carreras:', error));
  }

  getCarreras(): void {
    this.carrerasService.consultarCarreras()
      .then((carreras) => {
        this.carreras = carreras;
      })
      .catch((error) => console.error('Error al obtener carreras:', error));
  }

  onGradoChange(gradoId: string): void {

    if (gradoId && parseInt(gradoId) < 3) {
      this.myForm.get('tipo_carrera')?.disable();
      this.myForm.get('carrera')?.disable();
    } else {
      this.myForm.get('tipo_carrera')?.enable();
      this.myForm.get('carrera')?.enable();
    }

    this.tiposCarrerasService.consultarTiposCarrerasPorGrado(gradoId.toString())
      .then((tiposCarreras) => {
        this.tipos_carreras = tiposCarreras;
      })
      .catch((error) => console.error('Error al obtener tipos de carreras:', error));

    const selectedGrado = this.grados.find(grado => grado.id === gradoId);
    this.gradoNombre = selectedGrado ? selectedGrado.nombre : '';
  }

  onTipoCarreraChange(tipoCarreraId: string): void {
    this.carrerasService.consultarCarrerasPorIdGrado(this.grado, tipoCarreraId)
      .then((carreras) => {
        this.carreras = carreras;
      })
      .catch((error) => console.error('Error al obtener carreras:', error));

    const selectedTipoCarrera = this.tipos_carreras.find(tipoCarrera => tipoCarrera.id === tipoCarreraId);
    this.tipoCarreraNombre = selectedTipoCarrera ? selectedTipoCarrera.nombre : '';
  }

  onCarreraChange(carreraId: string): void {
    const selectedCarrera = this.carreras.find(carrera => carrera.id === carreraId);
    this.carreraNombre = selectedCarrera ? selectedCarrera.nombre : '';
  }

  getMunicipios(): void {
    this.codigosPostalesService.consultarMunicipios()
      .then((municipios) => {
        this.municipios = municipios;
      })
      .catch((error) => console.error('Error al obtener municipios:', error));
  }

  async getCodigosPostales(params: { municipio?: string }): Promise<void> {
    const { municipio } = params;

    await this.codigosPostalesService.consultarCodigosPostales({ municipio }).then(codigos => {
      this.allCodigosPostales = codigos;
    }).catch(error => {
      console.error('Error al consultar códigos postales:', error);
    });

    this.codigosPostales = Array.from(new Set(this.allCodigosPostales.map(cp => cp.cp))).map(cp => {
      return this.allCodigosPostales.find(item => item.cp === cp);
    });
  }

  getColoniasByCP(): void {
    const cp = this.myForm.get('cp')?.value;

    this.codigosPostalesService.consultarColonias(cp)
      .then((colonias) => {
        this.colonias = colonias;
      })
      .catch((error) => console.error('Error al obtener colonias:', error));
  }

  getModalidades(): void {
    this.modalidadesService.consultarModalidades()
      .then(modalidades => {
        this.modalidades = modalidades;
      })
      .catch(error => console.error('Error al obtener modalidades:', error));
  }

  onColoniaChange(colonia: string): void {
    const selectedColonia = this.colonias.find(item => item.colonia === colonia);
    if (selectedColonia) {
      this.tipoAsentamiento = selectedColonia.tipo_asentamiento;
      this.tipoZona = selectedColonia.tipo_zona;
    }
  }

  syncDataBase(): void {
    this.codigosPostalesService.getCodigosPostales().subscribe({
      next: (response) => {
        this.codigosPostalesService.syncLocalDataBase(response.data);
        this.allCodigosPostales = response.data;
      },
      error: (error) => {
        console.error('Error al cargar todos los códigos postales:', error);
      }
    });
    this.modalidadesService.getModalidades().subscribe({
      next: (response) => {
        this.modalidadesService.syncLocalDataBase(response.data);
      },
      error: (error) => {
        console.error('Error al obtener modalidades:', error);
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${year}-${month}-${day}` || '';
  }

  async getMyForm(): Promise<any> {

    const idApirante = (await this.aspirantesBeneficioService.getLastId() || 0) + 1;
    const now = new Date();

    const formattedDate = `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)} ${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`;
    return {
      ...this.myForm.value,
      nombres: this.myForm.get('nombres')?.value.toUpperCase(),
      id: idApirante,
      fecha_nacimiento: this.formatDate(this.myForm.get('fecha_nacimiento')?.value),
      estado: 'Jalisco',
      municipio: this.myForm.get('municipio')?.value,
      ciudad: this.myForm.get('municipio')?.value,
      tipo_asentamiento: this.tipoAsentamiento,
      tipo_zona: this.tipoZona,
      fecha_evento: formattedDate,
      created_id: 1,
      created_at: formattedDate,
      grado: this.gradoNombre,
      tipo_carrera: this.tipoCarreraNombre,
      modulo: this.modulo_actual
    };
  }

  getMyFormEdit(): any {
    const selectedGrado = this.grados.find(grado => grado.id === this.myForm.get('grado')?.value);
    const selectedTipoCarrera = this.tipos_carreras.find(tipoCarrera => tipoCarrera.id === this.myForm.get('tipo_carrera')?.value);

    return {
      ...this.myForm.value,
      id: this.editAspirante.id,
      curp: this.editAspirante.curp,
      nombres: this.myForm.get('nombres')?.value.toUpperCase(),
      fecha_nacimiento: this.formatDate(this.myForm.get('fecha_nacimiento')?.value),
      fecha_evento: this.editAspirante.fecha_evento,
      estado: 'Jalisco',
      municipio: this.myForm.get('municipio')?.value,
      ciudad: this.myForm.get('municipio')?.value,
      tipo_asentamiento: this.myForm.get('tipo_asentamiento')?.value,
      tipo_zona: this.myForm.get('tipo_zona')?.value,
      grado: selectedGrado ? selectedGrado.nombre : '',
      tipo_carrera: selectedTipoCarrera ? selectedTipoCarrera.nombre : '',
      modulo: this.modulo_actual
    };
  }

  selectedValue2() {
    this.selectedValue = this.myForm.get('id_modalidad')?.value;
    if (this.selectedValue == '6') {
      this.myForm.get('grado')?.enable();
    } else {
      this.myForm.get('grado')?.disable();
    }
  }


  disabledGradoCarrera(): void {
    this.myForm.get('grado')?.disable();
    this.myForm.get('tipo_carrera')?.disable();
    this.myForm.get('carrera')?.disable();
  }


  onSafe() {
    this.myForm.markAsUntouched();
  }

  toUpperCaseCurp(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.myForm.get('curp')?.setValue(input.value);


    const curp = input.value;
    const birthDateMatch = curp.match(/^.{4}(\d{2})(\d{2})(\d{2})/);
    if (birthDateMatch) {
      const year = parseInt(birthDateMatch[1], 10) + (parseInt(birthDateMatch[1], 10) > 25 ? 1900 : 2000);
      const month = parseInt(birthDateMatch[2], 10) - 1;
      const day = parseInt(birthDateMatch[3], 10);
      const birthDate = new Date(year, month, day);


      this.myForm.get('fecha_nacimiento')?.setValue(birthDate);
    }
  }

  toUpperCaseName(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.myForm.get('nombreCompleto')?.setValue(input.value);
  }

  capitalizeWords(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.toTitleCase(input.value);
    this.myForm.get('nombreCompleto')?.setValue(input.value);
  }

  toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

}
