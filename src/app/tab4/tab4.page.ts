import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule],
})
export class Tab4Page implements OnInit {
  segmentoActivo: string = 'registrar';
  productos: any[] = [];
  productosFiltrados: any[] = [];
  proveedores: any[] = [];
  categorias: any[] = [];
  nuevaCategoriaNombre: string = '';
  previewImage: string | ArrayBuffer | null = null;
  imagenFile: File | null = null;
  textoBusqueda: string = '';

  nuevoProducto = {
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    voltaje: '',
    potencia: '',
    corriente: '',
    precio: null,
    cantidad: 0, // <--- NUEVO CAMPO
    imagen_base64: '',
    proveedor_id: null,
    categoria_id: null,
  };

  productoEditable: any = null;

  private baseApiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://pe-backend-frontend.onrender.com/api';

  private apiUrl = `${this.baseApiUrl}/productos`;
  private apiProveedores = `${this.baseApiUrl}/proveedores`;
  private apiCategorias = `${this.baseApiUrl}/categorias`;

  constructor(private http: HttpClient, private alertCtrl: AlertController) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarProveedores();
    this.cargarCategorias();
  }

  alCambiarSegmento() {
    if (this.segmentoActivo === 'editar') {
      this.cargarProductos();
      this.productoEditable = null;
    }
  }

  cargarProductos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.productos = data;
        this.filtrarProductos(); // Actualiza los filtrados al cargar
      },
      error: () => this.mostrarAlerta('Error al cargar productos'),
    });
  }

  cargarProveedores() {
    this.http.get<any[]>(this.apiProveedores).subscribe({
      next: (data) => (this.proveedores = data),
      error: () => this.mostrarAlerta('Error al cargar proveedores'),
    });
  }

  cargarCategorias() {
    this.http.get<any[]>(this.apiCategorias).subscribe({
      next: (data) => (this.categorias = data),
      error: () => this.mostrarAlerta('Error al cargar categorías'),
    });
  }

  filtrarProductos() {
    const texto = this.textoBusqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter((producto) => {
      const nombre = producto.nombre?.toLowerCase() || '';
      const categoriaNombre = this.obtenerNombreCategoria(producto.categoria_id).toLowerCase();
      return nombre.includes(texto) || categoriaNombre.includes(texto);
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.nuevoProducto.imagen_base64 = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onFileSelectedEditar(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (this.productoEditable) {
          this.productoEditable.imagen_base64 = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  registrarProducto() {
    if (!this.nuevoProducto.nombre || this.nuevoProducto.proveedor_id === null) {
      this.mostrarAlerta('Completa los campos obligatorios');
      return;
    }

    this.http.post(`${this.apiUrl}/guardar`, this.nuevoProducto).subscribe({
      next: () => {
        this.mostrarAlerta('Producto registrado correctamente');
        this.limpiarNuevoProducto();
        this.cargarProductos();
        this.segmentoActivo = 'listar';
      },
      error: () => this.mostrarAlerta('Error al registrar producto'),
    });
  }

  limpiarNuevoProducto() {
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      marca: '',
      modelo: '',
      voltaje: '',
      potencia: '',
      corriente: '',
      precio: null,
      cantidad: 0, // <--- NUEVO CAMPO
      imagen_base64: '',
      proveedor_id: null,
      categoria_id: null,
    };
    this.previewImage = null;
    this.imagenFile = null;
  }

  seleccionarProductoParaEditar(producto: any) {
    this.productoEditable = { ...producto };
  }

  guardarEdicion() {
    if (!this.productoEditable?.id || this.productoEditable.proveedor_id === null) {
      this.mostrarAlerta('Producto inválido para edición');
      return;
    }

    const url = `${this.apiUrl}/${this.productoEditable.id}`;
    this.http.put(url, this.productoEditable).subscribe({
      next: () => {
        this.mostrarAlerta('Producto actualizado correctamente');
        this.cargarProductos();
        this.segmentoActivo = 'listar';
      },
      error: () => this.mostrarAlerta('Error al actualizar producto'),
    });
  }

  eliminarProducto(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          this.mostrarAlerta('Producto eliminado correctamente');
          this.cargarProductos();
          this.productoEditable = null;
          this.segmentoActivo = 'listar';
        },
        error: () => this.mostrarAlerta('Error al eliminar producto'),
      });
    }
  }

  obtenerNombreProveedor(id: number): string {
    return this.proveedores.find((p) => p.id === id)?.nombre || 'Sin proveedor';
  }

  obtenerNombreCategoria(id: number): string {
    return this.categorias.find((c) => c.id === id)?.nombre || 'Sin categoría';
  }

  agregarCategoriaEditar() {
    const nombre = this.nuevaCategoriaNombre?.trim();
    if (!nombre) {
      this.mostrarAlerta('Debes escribir un nombre para la categoría');
      return;
    }

    this.http.post(`${this.apiCategorias}/guardar`, { nombre }).subscribe({
      next: (categoriaCreada: any) => {
        this.mostrarAlerta('Categoría agregada correctamente');
        this.cargarCategorias();

        if (this.segmentoActivo === 'editar' && this.productoEditable) {
          this.productoEditable.categoria_id = categoriaCreada.id;
        } else if (this.segmentoActivo === 'registrar') {
          this.nuevoProducto.categoria_id = categoriaCreada.id;
        }

        this.nuevaCategoriaNombre = '';
      },
      error: () => this.mostrarAlerta('Error al agregar categoría'),
    });
  }

  async mostrarAlerta(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Aviso',
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
