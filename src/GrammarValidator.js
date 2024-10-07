import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';

const GrammarValidator = () => {
  const [terminals, setTerminals] = useState('');
  const [nonTerminals, setNonTerminals] = useState('');
  const [productions, setProductions] = useState('');
  const [word, setWord] = useState('');
  const [derivationTreeGeneral, setDerivationTreeGeneral] = useState('');
  const [derivationTreeParticular, setDerivationTreeParticular] = useState('');
  const [membership, setMembership] = useState('');

  const handleSubmitGrammar = async () => {
    const grammarData = {
      terminals: terminals.split(',').map(t => t.trim()),
      non_terminals: nonTerminals.split(',').map(nt => nt.trim()),
      start_symbol: nonTerminals.split(',')[0].trim(), // Primer no terminal como símbolo inicial
      productions: productions.split(';').reduce((acc, prod) => {
        const [key, value] = prod.split('->');
        // Verifica si la clave ya existe en el acumulador
        if (!acc[key.trim()]) {
          acc[key.trim()] = []; // Inicializa un arreglo si no existe
        }
        // Agrega las producciones en un arreglo
        acc[key.trim()].push(...value.split('|').map(v => v.trim()));
        return acc;
      }, {}),
    };
    console.log('Gramática a enviar:', grammarData);

    try {
      await axios.post('http://localhost:8000/grammar/', grammarData);
      alert('Gramática ingresada correctamente.');
    } catch (error) {
      console.error('Error al ingresar la gramática:', error);
    }
  };

  const handleValidate = async () => {
    try {
      const response = await axios.post('http://localhost:8000/word/', { word });
      console.log(response.data); // Agrega esto para ver la respuesta completa
  
      // Limpiar el string de los árboles de derivación
      const cleanString = (dotString) => {
        return dotString
          .replace(/\/\/.*?\n/g, '') // Elimina los comentarios
          .replace(/\\n/g, '') // Elimina los caracteres de nueva línea
          .trim(); // Elimina espacios en blanco al principio y al final
      };
  
      setDerivationTreeGeneral(cleanString(response.data.derivation_tree_general));
      setDerivationTreeParticular(cleanString(response.data.derivation_tree_particular));
      setMembership(response.data.belongs ? 'Pertenece' : 'No pertenece');
    } catch (error) {
      console.error('Error al validar la palabra:', error);
    }
  };
  

  // Renderiza el árbol de derivación al recibir nuevos datos
  useEffect(() => {
    const renderGraph = (dotString, elementId) => {
      if (dotString) {
        const viz = new Viz({ Module, render });
        viz.renderString(dotString)
          .then((result) => {
            document.getElementById(elementId).innerHTML = result;
          })
          .catch((error) => {
            console.error('Error al renderizar el gráfico:', error);
            document.getElementById(elementId).innerHTML = 'Error al renderizar el gráfico.';
          });
      } else {
        document.getElementById(elementId).innerHTML = 'No hay datos para mostrar.';
      }
    };

    renderGraph(derivationTreeGeneral, 'general-derivation-tree');
    renderGraph(derivationTreeParticular, 'particular-derivation-tree');
  }, [derivationTreeGeneral, derivationTreeParticular]);

  return (
    <div>
      <h1>Validador de Gramática</h1>
      <div>
        <label>
          Símbolos terminales (separados por comas):
          <input type="text" value={terminals} onChange={(e) => setTerminals(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Símbolos no terminales (separados por comas):
          <input type="text" value={nonTerminals} onChange={(e) => setNonTerminals(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Producciones:
          <input type="text" value={productions} onChange={(e) => setProductions(e.target.value)} />
        </label>
      </div>
      <button onClick={handleSubmitGrammar}>Ingresar Gramática</button>

      <div>
        <label>
          Palabra a validar:
          <input type="text" value={word} onChange={(e) => setWord(e.target.value)} />
        </label>
      </div>
      <button onClick={handleValidate}>Validar</button>

      <h2>Resultados</h2>
      <p>Relación de pertenencia: {membership}</p>

      <h3>Árbol de derivación general:</h3>
      <div id="general-derivation-tree" />
      <h3>Árbol de derivación particular:</h3>
      <div id="particular-derivation-tree" />
    </div>
  );
};

export default GrammarValidator;
