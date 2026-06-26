import { useState } from 'react'
import './App.css'
import { parseCustomFormat, stringifyCustomFormat } from './utils/parser'

function App() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState(null)
  const [isCopied, setIsCopied] = useState(false)

  function handleSerialize() {
    if (!input.trim()) {
      setError('Введите строку для сериализации!')
      setResult('')
      return
    }

    try {
      const parsed = parseCustomFormat(input)
      const jsonString = JSON.stringify(parsed, null, 2)
      
      setResult(jsonString)
      setError(null)
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
      setResult('')
    }
  }

  function handleDeserialize() {
    if (!input.trim()) {
      setError('Введите JSON для десериализации!')
      setResult('')
      return
    }

    try {
      const parsed = JSON.parse(input)
      const customString = stringifyCustomFormat(parsed)
      
      setResult(customString)
      setError(null)
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
      setResult('')
    }
  }

  function handleClear() {
    setInput('')
    setResult('')
    setError(null)
  }

  async function handleCopy() {
  if (!result) {
    setError('Нет данных для копирования!')
    return
  }

  try {
    await navigator.clipboard.writeText(result)
    setIsCopied(true)
    setError(null)
    
    setTimeout(() => {
      setIsCopied(false)
    }, 3000)
    
  } catch (err) {
    setError('Не удалось скопировать текст!')
    setIsCopied(false)
  }
}

  function handleDownload() {
    if (!result) {
      setError('Нет данных для скачивания!')
      return
    }

    try {
      const blob = new Blob([result], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `data_${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setError(null)
    } catch (err) {
      setError('Не удалось скачать файл!')
    }
  }

  return (
    <div className = "container">
      <h1 className = "app-title">Парсер</h1>
      <p className = "app-description">
        Преобразование строки в JSON и обратно
      </p>

      <hr />

      <div className = "input-section">
        <textarea
          className = "input-field"
          rows = {6}
          value = {input}
          onChange = {(e) => setInput(e.target.value)}
          placeholder = "Введите строку или JSON..."
        />
      </div>

      <div className = "action-buttons">
        <button className = "btn btn-serialize" onClick = {handleSerialize}>
          Сериализовать
        </button>
        <button className = "btn btn-deserialize" onClick = {handleDeserialize}>
          Десериализовать
        </button>
        <button className = "btn btn-clear" onClick = {handleClear}>
          Очистить
        </button>
      </div>

      {error && (
        <div className = "error-message">
          {error}
        </div>
      )}

      {result && (
        <div className = "result-section">
          <div className = "result-header">
            <h3>Результат:</h3>
            <div className = "result-actions">
              <button className = "btn-small btn-copy" onClick = {handleCopy}>
                {isCopied ? '✔ Скопировано' : 'Копировать'}
              </button>
              <button className = "btn-small btn-download" onClick = {handleDownload}>
                Скачать
              </button>
            </div>
          </div>
          <pre className = "result-content">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}

export default App