
import './style.css';

import { auth, db } from '../firebase.js';

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';

import {
    ref,
    set,
    onValue
} from 'firebase/database';

let deseos = [];
let detenerEscucha = null;
let filtroActual = "todos";
let textoBusqueda = "";
let filtroProfesional = "todos";
let indiceDeseoEliminar = null;

document.querySelector('#app').innerHTML = `

<div id="login-container">

    <h1>Cumpliendo Sueños</h1>

    <h2>Iniciar sesión</h2>

    <form id="form-login">

        <label for="email">Correo electrónico:</label>
        <input type="email" id="email" required>

        <label for="password">Contraseña:</label>
        <input type="password" id="password" required>

        <button type="submit">Entrar</button>

    </form>

</div>

<div id="contenido-app" style="display: none;">

    <button id="cerrar-sesion">Cerrar sesión</button>

    <h1>Cumpliendo Sueños</h1>

    <h2>Registrar un deseo</h2>

    <form id="form-deseo">

        <label for="nombre">Nombre de la persona:</label>
        <input type="text" id="nombre" required>

        <label for="profesional">Profesional responsable:</label>

        <select id="profesional" required>
            <option value="">Selecciona un profesional</option>
            <option value="Fisioterapeuta">Fisioterapeuta</option>
            <option value="Terapeuta ocupacional">Terapeuta ocupacional</option>
            <option value="Psicólogo">Psicólogo</option>
        </select>

        <br><br>

        <label for="descripcion">¿Cuál es su deseo?</label>
        <textarea id="descripcion" required></textarea>

        <br><br>

        <button type="submit">Añadir deseo</button>

    </form>

    <h2>Estadísticas</h2>

    <div id="estadisticas">
        <p>Total de deseos: <span id="total">0</span></p>
        <p>Pendientes: <span id="pendientes">0</span></p>
        <p>Realizados: <span id="realizados">0</span></p>
    </div>

    <h2>Todos los deseos</h2>

    <div class="controles-deseos">

        <input
            type="text"
            id="buscador"
            placeholder="Buscar un deseo..."
        >

        <select id="filtro">
            <option value="todos">Todos los deseos</option>
            <option value="pendientes">Pendientes</option>
            <option value="realizados">Realizados</option>
        </select>

        <select id="filtro-profesional">
            <option value="todos">Todos los profesionales</option>
            <option value="Fisioterapeuta">Fisioterapeutas</option>
            <option value="Terapeuta ocupacional">Terapeutas ocupacionales</option>
            <option value="Psicólogo">Psicólogos</option>
        </select>

    </div>

    <div id="lista-deseos"></div>

    <div id="modal-editar" class="modal-oculto">

        <h2>Editar deseo</h2>

        <form id="form-editar">

            <label for="editar-nombre">Nombre:</label>
            <input type="text" id="editar-nombre" required>

            <label for="editar-descripcion">Descripción:</label>
            <textarea id="editar-descripcion" required></textarea>

            <label for="editar-profesional">
                Profesional responsable:
            </label>

            <select id="editar-profesional" required>
                <option value="Fisioterapeuta">Fisioterapeuta</option>
                <option value="Terapeuta ocupacional">Terapeuta ocupacional</option>
                <option value="Psicólogo">Psicólogo</option>
            </select>

            <button type="submit">Guardar cambios</button>

            <button type="button" id="cancelar-edicion">
                Cancelar
            </button>

        </form>

    </div>
    <div id="notificacion" class="notificacion">
     <span id="mensaje-notificacion"></span>
    </div>
    <div id="modal-confirmacion" class="modal-oculto">

    <div class="contenido-confirmacion">

        <h2>¿Eliminar deseo?</h2>

        <p>¿Estás seguro de que quieres eliminar este deseo?</p>

        <div class="botones-confirmacion">

            <button id="confirmar-eliminar">
                Sí, eliminar
            </button>

            <button id="cancelar-eliminar">
                Cancelar
            </button>

        </div>

    </div>

</div>
</div>

`;
// INICIAR SESIÓN

const formularioLogin = document.getElementById('form-login');

formularioLogin.addEventListener('submit', (event) => {

    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
    .then(() => {
        console.log('Inicio de sesión correcto');
    })
    .catch((error) => {
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);

        alert('Error: ' + error.code);
    });

});


// COMPROBAR SI HAY UNA SESIÓN INICIADA

onAuthStateChanged(auth, (usuario) => {

    const login = document.getElementById('login-container');
    const contenido = document.getElementById('contenido-app');

    if (usuario) {

        login.style.display = 'none';
        contenido.style.display = 'block';

        // Escuchar los cambios de Firebase

        if (!detenerEscucha) {

            const deseosRef = ref(db, 'deseos');

            detenerEscucha = onValue(deseosRef, (snapshot) => {

                const datos = snapshot.val();

                if (datos) {

                    deseos = Object.values(datos);

                } else {

                    // Recuperar los deseos antiguos del navegador

                    deseos = JSON.parse(
                        localStorage.getItem('deseos')
                    ) || [];

                    if (deseos.length > 0) {
                        set(deseosRef, deseos);
                    }

                }

                mostrarDeseos();

            }, (error) => {

                console.error('Error al cargar los deseos:', error);

            });

        }

    } else {

        login.style.display = 'block';
        contenido.style.display = 'none';

        if (detenerEscucha) {

            detenerEscucha();
            detenerEscucha = null;

        }

    }

});


// CERRAR SESIÓN

document.getElementById('cerrar-sesion')
    .addEventListener('click', () => {

        signOut(auth);

    });

console.log(document.getElementById('modal-editar'));


const formulario = document.getElementById('form-deseo');
const listaDeseos = document.getElementById('lista-deseos');


// GUARDAR DESEOS EN LOCALSTORAGE

function guardarDeseos() {

    set(ref(db, 'deseos'), deseos)
        .catch((error) => {

            console.error('Error al guardar los deseos:', error);

            alert('No se han podido guardar los deseos.');

        });

}


// EDITAR UN DESEO

function editarDeseo(index) {

    const deseo = deseos[index];

    const modal = document.getElementById('modal-editar');

    if (!modal) {
        console.log('No se encuentra el formulario de edición');
        return;
    }

    document.getElementById('editar-nombre').value = deseo.nombre;

    document.getElementById('editar-descripcion').value =
        deseo.descripcion;

    document.getElementById('editar-profesional').value =
        deseo.profesional || 'Fisioterapeuta';

    document.getElementById('form-editar').dataset.index = index;

    modal.classList.remove('modal-oculto');

    console.log('Formulario de edición abierto');

}


// GUARDAR LOS CAMBIOS DE LA EDICIÓN

const formularioEditar = document.getElementById('form-editar');

formularioEditar.addEventListener('submit', (event) => {

    event.preventDefault();

    const index = Number(formularioEditar.dataset.index);

    const nuevoNombre =
        document.getElementById('editar-nombre').value.trim();

    const nuevaDescripcion =
        document.getElementById('editar-descripcion').value.trim();

    const nuevoProfesional =
        document.getElementById('editar-profesional').value;

    if (nuevoNombre === '' || nuevaDescripcion === '') {

        alert('Debes rellenar todos los campos.');
        return;

    }

    deseos[index].nombre = nuevoNombre;
    deseos[index].descripcion = nuevaDescripcion;
    deseos[index].profesional = nuevoProfesional;

    guardarDeseos();
    mostrarDeseos();

    document.getElementById('modal-editar')
        .classList.add('modal-oculto');

});


// CANCELAR LA EDICIÓN

document.getElementById('cancelar-edicion')
    .addEventListener('click', () => {

        document.getElementById('modal-editar')
            .classList.add('modal-oculto');

    });


// MOSTRAR ESTADÍSTICAS

function mostrarEstadisticas() {

    const total = deseos.length;

    const realizados = deseos.filter((deseo) => {
        return deseo.realizado === true;
    }).length;

    const pendientes = total - realizados;

    document.getElementById('total').textContent = total;
    document.getElementById('pendientes').textContent = pendientes;
    document.getElementById('realizados').textContent = realizados;

}


// MOSTRAR DESEOS

function mostrarDeseos() {

    listaDeseos.innerHTML = '';

    // Filtrar los deseos según el texto y el estado

    const deseosFiltrados = deseos.filter((deseo) => {

        const coincideBusqueda =
            deseo.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
            deseo.descripcion.toLowerCase().includes(textoBusqueda.toLowerCase());

        const coincideFiltro =
            filtroActual === "todos" ||
            (filtroActual === "pendientes" && !deseo.realizado) ||
            (filtroActual === "realizados" && deseo.realizado);

        const coincideProfesional =
            filtroProfesional === "todos" ||
            deseo.profesional === filtroProfesional;

        return coincideBusqueda && coincideFiltro && coincideProfesional;

    });


    // Mostrar mensaje si no hay resultados

    if (deseosFiltrados.length === 0) {

        listaDeseos.innerHTML = '<p>No se han encontrado deseos.</p>';

    } else {

        deseosFiltrados.forEach((deseo) => {

            const index = deseos.indexOf(deseo);

            const elemento = document.createElement('div');

            elemento.classList.add('tarjeta-deseo');

            if (deseo.realizado) {
                elemento.classList.add('deseo-realizado');
            } else {
                elemento.classList.add('deseo-pendiente');
            }

            elemento.innerHTML = `

                <h3>${deseo.nombre}</h3>

                <p>${deseo.descripcion}</p>

                <p>
                    <strong>Responsable:</strong>
                    ${deseo.profesional || 'Sin asignar'}
                </p>

                <p>
                    <strong>Fecha de creación:</strong>
                    ${deseo.fechaCreacion || 'No disponible'}
                </p>

                ${deseo.realizado ? `
                    <p>
                        <strong>Fecha de realización:</strong>
                        ${deseo.fechaRealizacion || 'No disponible'}
                    </p>
                ` : ''}

                <span class="etiqueta-estado ${deseo.realizado ? 'etiqueta-realizado' : 'etiqueta-pendiente'}">
                    ${deseo.realizado ? 'Realizado' : 'Pendiente'}
                </span>

                <button class="btn-completar" data-index="${index}">
                    ${deseo.realizado ? 'Desmarcar' : 'Marcar como realizado'}
                </button>

                <button class="btn-editar" data-index="${index}">
                    Editar
                </button>

                <button class="btn-eliminar" data-index="${index}">
                    Eliminar deseo
                </button>

            `;

            listaDeseos.appendChild(elemento);

        });

    }

    mostrarEstadisticas();

}

function mostrarNotificacion(mensaje) {

    const notificacion = document.getElementById('notificacion');
    const texto = document.getElementById('mensaje-notificacion');

    texto.textContent = mensaje;

    notificacion.style.display = 'block';

    setTimeout(() => {

        notificacion.style.display = 'none';

    }, 3000);

}

// BUSCADOR DE DESEOS

const buscador = document.getElementById('buscador');

buscador.addEventListener('input', (event) => {

    textoBusqueda = event.target.value;

    mostrarDeseos();

});


// FILTRO POR ESTADO

const filtro = document.getElementById('filtro');

filtro.addEventListener('change', (event) => {

    filtroActual = event.target.value;

    mostrarDeseos();

});


// FILTRO POR PROFESIONAL

const filtroProfesionalElemento =
    document.getElementById('filtro-profesional');

filtroProfesionalElemento.addEventListener('change', (event) => {

    filtroProfesional = event.target.value;

    mostrarDeseos();

});


// COMPLETAR, EDITAR Y ELIMINAR DESEOS

listaDeseos.addEventListener('click', (event) => {

    const index = Number(event.target.dataset.index);

    // COMPLETAR DESEO

    if (event.target.classList.contains('btn-completar')) {

        deseos[index].realizado = !deseos[index].realizado;

        if (deseos[index].realizado) {

            deseos[index].fechaRealizacion =
                new Date().toLocaleDateString('es-ES');

        } else {

            deseos[index].fechaRealizacion = null;

        }

    }

    // EDITAR DESEO

    if (event.target.classList.contains('btn-editar')) {

    console.log('Botón editar pulsado');
    console.log('Índice:', index);

    editarDeseo(index);

    console.log('Función editar ejecutada');

    return;

}

    // ELIMINAR DESEO

    if (event.target.classList.contains('btn-eliminar')) {

    indiceDeseoEliminar = index;

    document.getElementById('modal-confirmacion')
        .classList.remove('modal-oculto');

    return;

}

    guardarDeseos();
    mostrarDeseos();

});

// CONFIRMAR ELIMINACIÓN

document.getElementById('confirmar-eliminar')
    .addEventListener('click', () => {

        if (indiceDeseoEliminar !== null) {

            deseos.splice(indiceDeseoEliminar, 1);

            guardarDeseos();
            mostrarDeseos();

            mostrarNotificacion('Deseo eliminado correctamente.');

        }

        indiceDeseoEliminar = null;

        document.getElementById('modal-confirmacion')
            .classList.add('modal-oculto');

    });


// CANCELAR ELIMINACIÓN

document.getElementById('cancelar-eliminar')
    .addEventListener('click', () => {

        indiceDeseoEliminar = null;

        document.getElementById('modal-confirmacion')
            .classList.add('modal-oculto');

    });


// AÑADIR NUEVOS DESEOS

formulario.addEventListener('submit', (event) => {

    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const profesional = document.getElementById('profesional').value;

    const nuevoDeseo = {

        nombre: nombre,
        descripcion: descripcion,
        profesional: profesional,
        realizado: false,
        fechaCreacion: new Date().toLocaleDateString('es-ES'),
        fechaRealizacion: null

    };

    deseos.push(nuevoDeseo);

    guardarDeseos();
    mostrarDeseos();

    formulario.reset();

    mostrarNotificacion('¡Deseo creado correctamente!');

});


// MOSTRAR LOS DESEOS AL CARGAR LA PÁGINA

mostrarDeseos();
