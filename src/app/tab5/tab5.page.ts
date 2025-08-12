import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';

Keyboard.setScroll({ isDisabled: false });

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class Tab5Page implements OnInit {
  segmentoActivo: string = 'first';

  productosDisponibles: any[] = [];
  productosFiltrados: any[][] = [];
  filtroProductos: string[] = [];

  // ✅ Cambiado de boolean[][] a boolean[]
  mostrarSugerencias: boolean[] = [];

  cotizaciones: any[] = [];
  clientesDisponibles: any[] = [];
  clienteSeleccionado: string = '';
  filtroBusqueda: string = '';
  totalCotizacion: number = 0;

  cotizacionEditando: any = null;
  comprasConAdeudo: any[] = [];

  nuevaCotizacion = {
    cliente: '',
    fecha: '',
    folio: '',
    productos: [{ id: null, cantidad: 1 }]
  };

  private apiBase = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://api-pa.onrender.com/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarCotizaciones();
    this.cargarClientes();
    this.cargarAdeudos();
    this.inicializarFiltros();
  }

  inicializarFiltros() {
    this.filtroProductos = this.nuevaCotizacion.productos.map(() => '');
    this.productosFiltrados = this.nuevaCotizacion.productos.map(() => [...this.productosDisponibles]);
    this.mostrarSugerencias = this.nuevaCotizacion.productos.map(() => false); // ✅
  }

  filtrarProductos(index: number) {
    const termino = this.filtroProductos[index]?.toLowerCase() || '';
    this.productosFiltrados[index] = this.productosDisponibles.filter(p =>
      p.nombre.toLowerCase().includes(termino)
    );
    this.mostrarSugerencias[index] = termino.length > 0;
  }

  seleccionarProducto(index: number, producto: any) {
    this.nuevaCotizacion.productos[index].id = producto.id;
    this.filtroProductos[index] = producto.nombre;
    this.mostrarSugerencias[index] = false;
    this.calcularTotal();
  }

  cargarProductos() {
    this.http.get<any[]>(`${this.apiBase}/productos`).subscribe(data => {
      this.productosDisponibles = data;

      if (this.nuevaCotizacion.productos.length > 0) {
        this.inicializarFiltros();
      }
    });
  }

  cargarCotizaciones() {
    this.http.get<any[]>(`${this.apiBase}/cotizaciones`).subscribe(data => {
      this.cotizaciones = data;
      this.nuevaCotizacion.folio = this.generarFolio();
    });
  }

  cargarClientes() {
    this.http.get<any[]>(`${this.apiBase}/clientes`).subscribe(data => {
      this.clientesDisponibles = data;
    });
  }

  cargarAdeudos() {
    this.http.get<any[]>(`${this.apiBase}/cotizaciones/adeudos`).subscribe(data => {
      this.comprasConAdeudo = data.map(c => ({
        ...c,
        montoAbono: 0
      }));
    });
  }

  verificarClienteSeleccionado() {
    this.nuevaCotizacion.cliente = this.clienteSeleccionado === 'otro' ? '' : this.clienteSeleccionado;
  }

  agregarProducto() {
    this.nuevaCotizacion.productos.push({ id: null, cantidad: 1 });
    this.filtroProductos.push('');
    this.productosFiltrados.push([...this.productosDisponibles]);
    this.mostrarSugerencias.push(false);
    this.calcularTotal();
  }

  calcularTotal() {
    this.totalCotizacion = this.nuevaCotizacion.productos.reduce((total, prod) => {
      const productoInfo = this.productosDisponibles.find(p => p.id === prod.id);
      const precio = productoInfo?.precio || 0;
      return total + (precio * (prod.cantidad || 0));
    }, 0);
  }

  generarFolio(): string {
    const cotizacionesOrdenadas = [...this.cotizaciones].sort((a, b) => {
      const numA = parseInt(a.folio?.split('-')[1] || '0');
      const numB = parseInt(b.folio?.split('-')[1] || '0');
      return numB - numA;
    });
    const ultimoFolio = cotizacionesOrdenadas[0]?.folio;
    const ultimoNumero = ultimoFolio ? parseInt(ultimoFolio.split('-')[1]) : 0;
    const nuevoNumero = ultimoNumero + 1;
    return `COT-${nuevoNumero.toString().padStart(4, '0')}`;
  }

  registrarCotizacion() {
    const productosValidos = this.nuevaCotizacion.productos.filter(p => p.id && p.cantidad > 0);
    if (!this.nuevaCotizacion.cliente || !this.nuevaCotizacion.fecha || productosValidos.length === 0) {
      alert('Por favor completa todos los campos y al menos un producto válido.');
      return;
    }

    const productosSinStock = productosValidos.filter(prod => {
      const productoEnInventario = this.productosDisponibles.find(p => p.id === prod.id);
      return !productoEnInventario || productoEnInventario.cantidad < prod.cantidad;
    });

    if (productosSinStock.length > 0) {
      const nombres = productosSinStock.map(p => {
        const prodInfo = this.productosDisponibles.find(x => x.id === p.id);
        return prodInfo ? prodInfo.nombre : `ID ${p.id}`;
      }).join(', ');
      alert(`No hay suficiente stock para los siguientes productos: ${nombres}`);
      return;
    }

    const payload = {
      cliente: this.nuevaCotizacion.cliente,
      fecha: this.nuevaCotizacion.fecha,
      folio: this.nuevaCotizacion.folio,
      productos: productosValidos,
      abono: 0
    };

    this.http.post(`${this.apiBase}/cotizaciones`, payload).subscribe(() => {
      alert('Compra registrada con éxito');
      this.resetFormulario();
      this.cargarCotizaciones();
      this.cargarProductos();
      this.cargarAdeudos();
      this.segmentoActivo = 'third';
    }, error => {
      alert('Error al registrar cotización');
      console.error(error);
    });
  }

  resetFormulario() {
    this.clienteSeleccionado = '';
    this.nuevaCotizacion = {
      cliente: '',
      fecha: '',
      folio: this.generarFolio(),
      productos: [{ id: null, cantidad: 1 }]
    };
    this.totalCotizacion = 0;
    this.inicializarFiltros();
  }

  eliminarCotizacion(id: number) {
    if (!confirm('¿Seguro que quieres eliminar esta cotización?')) return;
    this.http.delete(`${this.apiBase}/cotizaciones/${id}`).subscribe(() => {
      alert('Cotización eliminada');
      this.cotizaciones = this.cotizaciones.filter(c => c.id !== id);
      this.cargarAdeudos();
    }, error => {
      alert('Error al eliminar cotización');
      console.error(error);
    });
  }

  editarCotizacion(cotizacion: any) {
    this.cotizacionEditando = {
      ...cotizacion,
      productos: cotizacion.productos.map((p: any) => {
        const original = this.productosDisponibles.find(prod => prod.nombre === p.nombre);
        return {
          id: original ? original.id : null,
          cantidad: p.cantidad
        };
      })
    };
  }

  guardarEdicionCotizacion() {
    const productosValidos = this.cotizacionEditando.productos.filter((p: any) => p.id && p.cantidad > 0);

    if (!this.cotizacionEditando.cliente || !this.cotizacionEditando.fecha || productosValidos.length === 0) {
      alert('Por favor completa todos los campos');
      return;
    }

    const payload = {
      cliente: this.cotizacionEditando.cliente,
      fecha: this.cotizacionEditando.fecha,
      folio: this.cotizacionEditando.folio,
      productos: productosValidos
    };

    this.http.put(`${this.apiBase}/cotizaciones/${this.cotizacionEditando.id}`, payload).subscribe(() => {
      alert('Cotización actualizada correctamente');
      this.cotizacionEditando = null;
      this.cargarCotizaciones();
      this.cargarAdeudos();
    }, error => {
      alert('Error al actualizar la cotización');
      console.error(error);
    });
  }

  cancelarEdicion() {
    this.cotizacionEditando = null;
  }

  get cotizacionesFiltradas() {
    if (!this.filtroBusqueda) return this.cotizaciones;
    const termino = this.filtroBusqueda.toLowerCase();
    return this.cotizaciones.filter(c =>
      c.cliente.toLowerCase().includes(termino) ||
      c.fecha.toLowerCase().includes(termino) ||
      (c.folio?.toLowerCase().includes(termino))
    );
  }

  registrarAbono(compra: any) {
    const saldoPendiente = compra.total - compra.pagado;

    if (compra.montoAbono <= 0 || compra.montoAbono > saldoPendiente) {
      alert(`Monto inválido. Debes abonar entre $1 y $${saldoPendiente}`);
      return;
    }

    const payload = {
      folio: compra.folio,
      monto: compra.montoAbono
    };

    this.http.post(`${this.apiBase}/cotizaciones/compras/pagar`, payload).subscribe(() => {
      alert('Abono registrado con éxito');
      this.cargarCotizaciones();
      this.cargarAdeudos();
    }, error => {
      alert('Error al registrar el abono');
      console.error(error);
    });
  }

  descargarPDF(id: number) {
    const url = `${this.apiBase}/cotizaciones/${id}/pdf`;

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = `cotizacion-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(objectUrl);
      })
      .catch(err => {
        console.error('Error al descargar el PDF:', err);
      });
  }
}
