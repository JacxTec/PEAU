import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonInput, IonButton, IonLabel, IonSegment,
  IonSegmentButton, IonSegmentContent, IonSegmentView, IonItem, IonAvatar,
  IonImg, IonButtons, IonCheckbox, IonCardSubtitle
} from '@ionic/angular/standalone';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  standalone: true,
  styleUrls: ['./tab1.page.scss'],
  imports: [
    IonCardSubtitle,
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonInput, IonButton, IonLabel, IonSegment,
    IonSegmentButton, IonSegmentContent, IonSegmentView, IonItem, IonAvatar,
    IonImg, IonButtons, IonCheckbox
  ]
})
export class Tab1Page {
  nuevoProveedor = { nombre: '', direccion: '', telefono: '', rfc: '' };
  imagenPreview: string | null = null;
  listaProveedores: any[] = [];
  listaProveedoresFiltrada: any[] = [];
  filtroBusqueda: string = '';

  // Usa API local si estás en localhost, si no usa producción en Render
  apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/proveedores'
    : 'https://api-pa.onrender.com/api/proveedores';

  constructor() {
    this.obtenerProveedores();
  }

  cargarImagen(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => this.imagenPreview = lector.result as string;
      lector.readAsDataURL(archivo);
    }
  }

  eliminarImagen() {
    this.imagenPreview = null;
  }

  guardarProveedor() {
    const proveedor = { ...this.nuevoProveedor, imagen: this.imagenPreview };

    fetch(`${this.apiUrl}/guardar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedor)
    })
      .then(() => {
        this.nuevoProveedor = { nombre: '', direccion: '', telefono: '', rfc: '' };
        this.imagenPreview = null;
        this.obtenerProveedores();
      })
      .catch(() => alert('Error al guardar proveedor'));
  }

  obtenerProveedores() {
    fetch(this.apiUrl)
      .then(res => res.json())
      .then(data => {
        this.listaProveedores = data.map((p: any) => ({ ...p, seleccionado: false }));
        this.aplicarFiltro();
      });
  }

  aplicarFiltro() {
    const filtro = this.filtroBusqueda.toLowerCase();
    this.listaProveedoresFiltrada = this.listaProveedores.filter(p =>
      p.nombre.toLowerCase().includes(filtro) || p.rfc.toLowerCase().includes(filtro)
    );
  }

  onBuscarChange() {
    this.aplicarFiltro();
  }

  cambiarImagenProveedor(event: any, proveedor: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => proveedor.imagen = lector.result as string;
      lector.readAsDataURL(archivo);
    }
  }

  eliminarImagenProveedor(proveedor: any) {
    if (confirm('¿Eliminar imagen?')) {
      proveedor.imagen = '';
      this.guardarCambiosProveedor(proveedor);
    }
  }

  guardarCambiosProveedor(proveedor: any) {
    const proveedorActualizado = {
      nombre: proveedor.nombre,
      direccion: proveedor.direccion,
      telefono: proveedor.telefono,
      rfc: proveedor.rfc,
      imagen: proveedor.imagen
    };

    fetch(`${this.apiUrl}/${proveedor.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedorActualizado)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then(() => {
        this.obtenerProveedores();
      })
      .catch(() => alert('Error al guardar los cambios'));
  }

  eliminarProveedor(id: number) {
    if (!confirm('¿Eliminar proveedor permanentemente?')) return;

    fetch(`${this.apiUrl}/${id}`, { method: 'DELETE' })
      .then(() => this.obtenerProveedores())
      .catch(() => alert('Error al eliminar proveedor'));
  }

  seleccionarTodos() {
    const marcar = this.listaProveedores.some(p => !p.seleccionado);
    this.listaProveedores.forEach(p => p.seleccionado = marcar);
  }

  imprimirTodos() {
    const seleccionados = this.listaProveedores.filter(p => p.seleccionado);
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un proveedor');
      return;
    }

    let contenido = '<h1>Proveedores Seleccionados</h1>';
    seleccionados.forEach(p => {
      contenido += `
        <div style="margin-bottom: 20px;">
          <h2>${p.nombre}</h2>
          <p><strong>Dirección:</strong> ${p.direccion}</p>
          <p><strong>Teléfono:</strong> ${p.telefono}</p>
          <p><strong>RFC:</strong> ${p.rfc}</p>
          ${p.imagen ? `<img src="${p.imagen}" style="width:80px;">` : ''}
        </div>
      `;
    });

    const ventana = window.open('', '', 'width=800,height=600');
    ventana?.document.write(`<html><head><title>Impresión</title></head><body>${contenido}</body></html>`);
    ventana?.document.close();
    ventana?.focus();
    ventana?.print();
    ventana?.close();
  }

  exportarPDF() {
    const seleccionados = this.listaProveedores.filter(p => p.seleccionado);
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un proveedor');
      return;
    }

    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text('Proveedores Seleccionados', 10, y);
    y += 10;

    seleccionados.forEach((p, i) => {
      doc.setFontSize(12);
      doc.text(`Proveedor ${i + 1}: ${p.nombre}`, 10, y); y += 6;
      doc.text(`Dirección: ${p.direccion}`, 10, y); y += 6;
      doc.text(`Teléfono: ${p.telefono}`, 10, y); y += 6;
      doc.text(`RFC: ${p.rfc}`, 10, y); y += 10;

      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save('proveedores_seleccionados.pdf');
  }
}

Keyboard.setScroll({ isDisabled: false });
