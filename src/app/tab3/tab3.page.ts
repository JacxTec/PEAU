import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';
import {
    IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSegmentView,
  IonSegmentContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonDatetime,
  IonTextarea,
  IonSearchbar,
  IonList,
  IonCheckbox,
  IonThumbnail
} from '@ionic/angular/standalone';

Keyboard.setScroll({ isDisabled: false });

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
      IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSegmentView,
  IonSegmentContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonDatetime,
  IonTextarea,
  IonSearchbar,
  IonList,
  IonCheckbox,
  IonThumbnail
  ],
})
export class Tab3Page implements OnInit {
  private apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://api-pa.onrender.com/api';

  segmentValue = 'Registrar';

  proveedores: any[] = [];
  productos: any[] = [];
  importaciones: any[] = [];
  importacionesFiltradas: any[] = [];
  seleccionados: number[] = [];
  filtro = '';

  nuevaImportacion = {
    id: null,
    producto: '',
    proveedor_id: null,
    cantidad: null,
    fecha: '',
    descripcion: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarProveedores();
    this.cargarProductos();
    this.cargarImportaciones();
  }

  cambiarSegmento(event: any) {
    this.segmentValue = event.detail.value;
  }

  cargarProveedores() {
    this.http.get<any[]>(`${this.apiBaseUrl}/proveedores`).subscribe(data => {
      this.proveedores = data;
    });
  }

  cargarProductos() {
    this.http.get<any[]>(`${this.apiBaseUrl}/productos`).subscribe(data => {
      this.productos = data;
    });
  }

  cargarImportaciones() {
    this.http.get<any[]>(`${this.apiBaseUrl}/importaciones`).subscribe(data => {
      this.importaciones = data;
      this.importacionesFiltradas = data;
    });
  }

  filtrarImportaciones() {
    const texto = this.filtro.toLowerCase();
    this.importacionesFiltradas = this.importaciones.filter(i =>
      i.producto.toLowerCase().includes(texto) ||
      (i.proveedor_nombre && i.proveedor_nombre.toLowerCase().includes(texto))
    );
  }

  guardarImportacion() {
  if (!this.nuevaImportacion.producto || !this.nuevaImportacion.proveedor_id) {
    alert('Por favor, completa el producto y proveedor.');
    return;
  }

  const esEdicion = !!this.nuevaImportacion.id;
  const url = esEdicion
    ? `${this.apiBaseUrl}/importaciones/${this.nuevaImportacion.id}`
    : `${this.apiBaseUrl}/importaciones`;

  const peticion = esEdicion
    ? this.http.put(url, this.nuevaImportacion)
    : this.http.post(url, this.nuevaImportacion);

  peticion.subscribe((resp: any) => {
    alert(esEdicion ? 'Importación actualizada' : 'Importación registrada');

    // Actualizamos lista local
    if (esEdicion) {
      const index = this.importaciones.findIndex(i => i.id === this.nuevaImportacion.id);
      if (index >= 0) this.importaciones[index] = resp;
    } else {
      this.importaciones.push(resp);
    }

    // Sincronizamos con lista filtrada también
    this.importacionesFiltradas = [...this.importaciones];

    this.resetFormulario();
    this.segmentValue = 'Lista';
    this.seleccionados = [];

  }, error => {
    alert('Error al guardar la importación');
    console.error(error);
  });
}
  editarImportacion(importacion: any) {
    this.nuevaImportacion = { ...importacion };
    this.segmentValue = 'Registrar';
  }

  eliminarImportacion(id: number) {
    if (confirm('¿Seguro que quieres eliminar esta importación?')) {
      this.http.delete(`${this.apiBaseUrl}/importaciones/${id}`).subscribe(() => {
        alert('Importación eliminada');
        this.seleccionados = this.seleccionados.filter(selId => selId !== id);
        this.importaciones = this.importaciones.filter(i => i.id !== id);
        this.importacionesFiltradas = [...this.importaciones];
      });
    }
  }

  seleccionarTodos() {
    this.seleccionados = this.importaciones.map(i => i.id);
  }

  toggleSeleccion(id: number) {
    const idx = this.seleccionados.indexOf(id);
    if (idx >= 0) this.seleccionados.splice(idx, 1);
    else this.seleccionados.push(id);
  }

  imprimirTodos() {
    const seleccionadas = this.importaciones.filter(i => this.seleccionados.includes(i.id));
    const ventana = window.open('', '', 'width=800,height=600');
    if (ventana) {
      ventana.document.write('<h1>Importaciones Seleccionadas</h1>');
      seleccionadas.forEach(i => {
        ventana.document.write(`<p><strong>${i.producto}</strong> - Cantidad: ${i.cantidad} - Fecha: ${i.fecha}</p>`);
      });
      ventana.document.close();
      ventana.print();
    }
  }

  resetFormulario() {
    this.nuevaImportacion = {
      id: null,
      producto: '',
      proveedor_id: null,
      cantidad: null,
      fecha: '',
      descripcion: '',
    };
  }
}
