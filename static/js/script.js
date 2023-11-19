// Mostra ou esconde os campos de sindicância e suspensão
function toggleSindicanciaInput() {
    const sindicanciaChecked = document.getElementById('sindicancia').checked;
    document.getElementById('sindicanciaInput').style.display = sindicanciaChecked ? 'block' : 'none';
}

function toggleSuspensaoInput(tipo) {
    const isChecked = document.getElementById(tipo === 'judicial' ? 'suspensaoJudicial' : 'afastamentoAcusado').checked;
    document.getElementById(tipo === 'judicial' ? 'suspensaoJudicialInput' : 'suspensaoAcusadoInput').style.display = isChecked ? 'block' : 'none';
    if (isChecked) {
        adicionarPeriodoSuspensao(tipo); // Adiciona o primeiro período de suspensão
    }
}

// Adiciona mais campos para período de suspensão
function adicionarPeriodoSuspensao(tipo) {
    const containerId = tipo === 'judicial' ? 'periodosSuspensaoJudicial' : 'periodosSuspensaoAcusado';
    const container = document.getElementById(containerId);
    const novoPeriodo = document.createElement('div');
    novoPeriodo.className = 'periodoSuspensao';
    novoPeriodo.innerHTML = '<label>Data Inicial da Suspensão:</label><input type="date" class="dataInicioSuspensao"><br><br>' +
        '<label>Data Final da Suspensão:</label><input type="date" class="dataFimSuspensao"><br><br>';
    container.appendChild(novoPeriodo);
}

function exibirModalErro(mensagem) {
    document.getElementById('mensagemErro').innerText = mensagem;
    document.getElementById('modalErro').style.display = 'block';
}

// Fechar o modal quando o usuário clica no 'X'
document.getElementsByClassName('close')[0].onclick = function() {
    document.getElementById('modalErro').style.display = 'none';
}

// Calcula a data de prescrição
function calcularPrescricao() {
    const dataFato = new Date(document.getElementById('dataFato').value);
    const dataSindicancia = document.getElementById('sindicancia').checked ? new Date(document.getElementById('dataSindicancia').value) : null;
    const natureza = document.getElementById('naturezaTransgressao').value;
    let prazo;

    switch (natureza) {
        case 'LEVE':
            prazo = 1;
            break;
        case 'MEDIA':
            prazo = 2;
            break;
        case 'GRAVE':
            prazo = 5;
            break;
    }

    const dataPrescricao = new Date(dataFato.getTime());
    dataPrescricao.setFullYear(dataPrescricao.getFullYear() + prazo);

    if (dataSindicancia && (dataSindicancia < dataFato || dataSindicancia >= dataPrescricao)) {
        exibirModalErro("A data de abertura de sindicância ou processo disciplinar deve ser posterior à data do fato e anterior à data de prescrição.");
        return;
    }

    if (!validarDatasSuspensao(dataFato, dataSindicancia, dataPrescricao)) {
        return;
    }

    const dataBase = dataSindicancia || dataFato;
    dataBase.setFullYear(dataBase.getFullYear() + prazo);
    dataBase.setDate(dataBase.getDate() + 1);

    const totalDiasSuspensao = calcularTotalDiasSuspensaoComLimite('judicial', dataPrescricao) + calcularTotalDiasSuspensaoComLimite('acusado', dataPrescricao);
    dataBase.setDate(dataBase.getDate() + totalDiasSuspensao);

    const opcoesDeData = {year: 'numeric', month: '2-digit', day: '2-digit'};
    document.getElementById('resultado').innerHTML = 'Essa transgressão prescreve em: ' + dataBase.toLocaleDateString('pt-BR', opcoesDeData);
}

// Calcula o total de dias de suspensão para um tipo específico, considerando a data limite
function calcularTotalDiasSuspensaoComLimite(tipo, dataLimite) {
    const containerId = tipo === 'judicial' ? 'periodosSuspensaoJudicial' : 'periodosSuspensaoAcusado';
    const periodosSuspensao = document.getElementById(containerId).getElementsByClassName('periodoSuspensao');
    let totalDias = 0;
    for (let i = 0; i < periodosSuspensao.length; i++) {
        const inicioSuspensao = new Date(periodosSuspensao[i].getElementsByClassName('dataInicioSuspensao')[0].value);
        let fimSuspensao = new Date(periodosSuspensao[i].getElementsByClassName('dataFimSuspensao')[0].value);

        // Limita o fim da suspensão pela data de prescrição normal
        if (fimSuspensao > dataLimite) {
            fimSuspensao = new Date(dataLimite.getTime());
        }

        if (inicioSuspensao <= fimSuspensao) {
            const diferenca = (fimSuspensao - inicioSuspensao) / (1000 * 60 * 60 * 24) + 1; // Diferença em dias
            totalDias += diferenca;
        }
    }
    return totalDias;
}

// Função para validar as datas de suspensão
function validarDatasSuspensao(dataFato, dataSindicancia, dataPrescricao) {
    const periodos = document.querySelectorAll('.periodoSuspensao');
    for (let i = 0; i < periodos.length; i++) {
        const inicioSuspensao = new Date(periodos[i].getElementsByClassName('dataInicioSuspensao')[0].value);
        //var fimSuspensao = new Date(periodos[i].getElementsByClassName('dataFimSuspensao')[0].value);

        if (inicioSuspensao < dataFato || inicioSuspensao > dataPrescricao || (dataSindicancia && inicioSuspensao < dataSindicancia)) {
            exibirModalErro("As datas iniciais de suspensão devem estar dentro do período entre a data do fato e a data de prescrição, respeitando a data de abertura de sindicância ou processo disciplinar, se aplicável.");
            return false;
        }
    }
    return true;
}
