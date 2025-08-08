// IMPORTACIONES
import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonInput, IonButton, IonSegment,
  IonSegmentButton, IonSegmentContent, IonSegmentView, IonLabel,
  IonCheckbox, IonItem, IonAvatar, IonImg, IonButtons
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Keyboard } from '@capacitor/keyboard';

Keyboard.setScroll({ isDisabled: false });

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonInput,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonSegmentContent,
    IonSegmentView,
    IonLabel,
    IonCheckbox,
    IonItem,
    IonAvatar,
    IonImg,
    IonButtons
  ]
})
export class Tab2Page {
  segmentoActivo = 'agregar';
  filtroBusqueda = '';
  imagenPreview: string | null = null;

  nuevoCliente: any = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    imagen: null
  };

  clientes: any[] = [];
  clientesFiltrados: any[] = [];

  readonly API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api/clientes'
  : 'https://pe-backend-frontend.onrender.com/api/clientes';

  constructor() {
    this.cargarClientes();
  }

  guardarCliente() {
    const nuevo = {
      nombre: this.nuevoCliente.nombre,
      email: this.nuevoCliente.email,
      telefono: this.nuevoCliente.telefono,
      direccion: this.nuevoCliente.direccion,
      imagen: this.nuevoCliente.imagen
    };

    fetch(`${this.API_URL}/guardar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    })
      .then(res => res.json())
      .then(() => {
        alert('Cliente guardado correctamente');
        this.limpiarFormulario();
        this.cargarClientes();
        this.segmentoActivo = 'lista';
      })
      .catch(err => {
        console.error('Error al guardar cliente', err);
        alert('Error al guardar cliente');
      });
  }

  guardarCambiosCliente(cliente: any) {
    fetch(`${this.API_URL}/${cliente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        imagen: cliente.imagen
      })
    })
      .then(res => res.json())
      .then(() => {
        alert('Cambios guardados');
        this.cargarClientes();
      })
      .catch(err => {
        console.error('Error al actualizar cliente:', err);
        alert('Error al actualizar cliente');
      });
  }

  eliminarCliente(id: number) {
    if (!confirm('¿Eliminar este cliente permanentemente?')) return;

    fetch(`${this.API_URL}/${id}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => {
        alert('Cliente eliminado');
        this.cargarClientes();
      })
      .catch(err => {
        console.error('Error al eliminar cliente:', err);
        alert('Error al eliminar cliente');
      });
  }

  cargarImagen(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.nuevoCliente.imagen = reader.result;
        this.imagenPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  cambiarImagenCliente(event: any, cliente: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        cliente.imagen = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarImagen() {
    this.nuevoCliente.imagen = null;
    this.imagenPreview = null;
  }

  eliminarImagenCliente(cliente: any) {
    cliente.imagen = null;
  }

  limpiarFormulario() {
    this.nuevoCliente = {
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      imagen: null
    };
    this.imagenPreview = null;
  }

  cargarClientes() {
    fetch(this.API_URL)
      .then(res => res.json())
      .then(data => {
        this.clientes = data.map((c: any) => ({ ...c, seleccionado: false }));
        this.clientesFiltrados = [...this.clientes];
      })
      .catch(err => {
        console.error('Error al cargar clientes:', err);
        alert('Error al cargar clientes');
      });
  }

  filtrarClientes() {
    const term = this.filtroBusqueda.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(term) ||
      cliente.email.toLowerCase().includes(term)
    );
  }

  seleccionarTodos() {
    this.clientes.forEach(cliente => (cliente.seleccionado = true));
  }

  imprimirSeleccionados() {
    const seleccionados = this.clientes.filter(c => c.seleccionado);
    console.log('Clientes seleccionados:', seleccionados);
    alert('Clientes seleccionados: ' + seleccionados.map(c => c.nombre).join(', '));
  }

  cambiarSegmento(valor: string) {
    this.segmentoActivo = valor;
  }
}
