
/* 1) Receber três números e retornar o maior */

function maiorNumero() {
    let a = Number(document.getElementById("num1").value);
    let b = Number(document.getElementById("num2").value);
    let c = Number(document.getElementById("num3").value);

    alert("Maior número: " + Math.max(a, b, c));
}


/* 2) Receber três números e retorná-los em ordem crescente */

function ordemCrescente() {
    let a = Number(document.getElementById("ord1").value);
    let b = Number(document.getElementById("ord2").value);
    let c = Number(document.getElementById("ord3").value);

    let numeros = [a, b, c].sort((x, y) => x - y);

    alert("Ordem crescente: " + numeros.join(", "));
}


/* 3) Verificar se uma string é palíndromo */

function verificarPalindromo() {
    let palavra = document.getElementById("palavra").value;

    let texto = palavra.toLowerCase().replace(/\s/g, "");

    let invertido = texto.split("").reverse().join("");

    if (texto === invertido) {
        alert("É um palíndromo!");
    } else {
        alert("Não é um palíndromo!");
    }
}


/* 4) Verificar se uma palavra é subconjunto de outra */

function verificarSubconjunto() {
    let palavra1 = document.getElementById("palavra1").value;
    let palavra2 = document.getElementById("palavra2").value;

    if (!palavra1.trim() || !palavra2.trim()) {
        alert("erro");
    } else if (palavra1.includes(palavra2)) {
        alert("é um subconjunto");
    } else {
        alert("não é um subconjunto");
    }
}


/* 5) Receber uma data e devolver o dia da semana */

function diaDaSemana() {
    let data = document.getElementById("data").value;

    if (!data) {
        alert("Informe uma data!");
        return;
    }

    let partes = data.split("-");

    let dataInformada = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    let dias = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado"
    ];

    alert("Dia da semana: " + dias[dataInformada.getDay()]);
}
