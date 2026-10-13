
let voce = prompt("Diga o seu nome: ");
let nota1 = prompt("Insira a nota 1: ");
let nota2 = prompt("Insira a nota 2: ");
let nota3 = prompt("Insira a nota 3: ");
let nota4 = prompt("Insira a nota 4: ");
let media = (parseFloat(nota1) + parseFloat(nota2) + parseFloat(nota3) + parseFloat(nota4)) / 4;

alert("Aluno: " + voce + "Média" + media.toFixed(2));