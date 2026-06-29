function splitFields(str) {
  const fields = []
  let current = ''
  let inArray = false

  for (const char of str) {
    if (char === '|') inArray = !inArray
    if (char === ',' && !inArray) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) fields.push(current.trim())
  return fields
}

function parseValue(valueStr) {
  const trimmed = valueStr.trim()

  if (trimmed.startsWith('|')) {
    const inner = trimmed.slice(1, -1)
    if (!inner.trim()) return []
    return inner.split(',').map(item => parseValue(item.trim()))
  }

  if (trimmed === 'T') return true
  if (trimmed === 'F') return false

  if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed)

  if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}


function checkName(keyPart, fieldNumber) {
  if (!keyPart.startsWith('*') || !keyPart.endsWith('*')) {
    return `Имя поля "${keyPart}" должно быть строкой: *${keyPart}*`
  }
  
  return null
}

function checkValue(valuePart, keyPart) {
  if (!valuePart) return `В поле "${keyPart}" отсутствует значение`

  if (valuePart.startsWith('|') && valuePart.endsWith('|')) {
    const inner = valuePart.slice(1, -1)
    
    if (!inner.trim()) return `Массив в поле "${keyPart}" не может быть пустым`

    const items = inner.split(',')
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i].trim() 
      
      if (item === '') {
        return `Элемент №${i + 1} в массиве "${keyPart}" не может быть пустым`
      }
      
      const isString = item.startsWith('*') && item.endsWith('*')
      const isNumber = !isNaN(item) && item !== ''
      const isBoolean = item === 'T' || item === 'F'
      
      if (!isString && !isNumber && !isBoolean) {
        return `Ошибка в массиве "${keyPart}" (элемент №${i + 1}): строка "${item}" должна быть строкой: *${item}*`
      }

      if (isString && !item.slice(1, -1).trim()) {
        return `Строковый элемент №${i + 1} в массиве "${keyPart}" не может быть пустым`
      }
    }
    return null 
  }

  if (!valuePart.startsWith('*') || !valuePart.endsWith('*')) {
    const isNumber = !isNaN(valuePart) && valuePart.trim() !== ''
    const isBoolean = valuePart === 'T' || valuePart === 'F'
    
    if (isNumber || isBoolean) {
      return null
    }
    
    return `Значение "${valuePart}" в поле "${keyPart}" должно быть строкой, числом или булевым значением`
  }
  
  const inner = valuePart.slice(1, -1)
  if (!inner.trim()) return `Строка "${valuePart}" не может быть пустой`
  
  return null
}

export function validateCustomFormat(str) {
  if (!str || typeof str !== 'string') {
    return { valid: false, error: 'Строка не может быть пустой' }
  }

  if (!str.startsWith('[')) {
    return { valid: false, error: 'Строка должна начинаться с "["' }
  }
  if (!str.endsWith(']')) {
    return { valid: false, error: 'Строка должна заканчиваться "]"' }
  }

  const content = str.slice(1, -1)
  if (!content.trim()) {
    return { valid: false, error: 'Внутри объекта нет данных' }
  }

  const fields = splitFields(content)
  if (fields.length === 0) {
    return { valid: false, error: 'Не найдено ни одного поля' }
  }

  let hasColon = false
  for (const field of fields) {
    if (field.includes(':')) {
      hasColon = true
      break
    }
  }
  if (!hasColon) {
    return { valid: false, error: 'Нет ни одного поля ключ-значение' }
  }

  if (!/\*[^*]+\*/g.test(content)) {
    return { valid: false, error: 'Имена полей должны быть в звёздочках' }
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    const num = i + 1

    if (!field.trim()) {
      return { valid: false, error: `Поле №${num} пустое` }
    }

    const colonIndex = field.indexOf(':')
    if (colonIndex === -1) {
      return { valid: false, error: `В поле №${num} нет двоеточия` }
    }

    if ((field.match(/:/g) || []).length > 1) {
      return { valid: false, error: `В поле №${num} несколько двоеточий` }
    }

    const keyPart = field.slice(0, colonIndex).trim()
    const valuePart = field.slice(colonIndex + 1).trim()

    const nameError = checkName(keyPart, num)
    if (nameError) return { valid: false, error: nameError }

    const valueError = checkValue(valuePart, keyPart)
    if (valueError) return { valid: false, error: valueError }
  }

  return { valid: true, error: null }
}

export function parseCustomFormat(str) {
  const validation = validateCustomFormat(str)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const content = str.slice(1, -1)
  const fields = splitFields(content)
  const result = {}

  for (const field of fields) {
    const colonIndex = field.indexOf(':')
    const keyPart = field.slice(0, colonIndex).trim()
    const valuePart = field.slice(colonIndex + 1).trim()
    
    const key = keyPart.replace(/\*/g, '')
    result[key] = parseValue(valuePart)
  }

  return result
}

export function stringifyCustomFormat(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Ожидается объект для преобразования')
  }

  const fields = []
  for (const [key, value] of Object.entries(obj)) {
    let formatted

    if (typeof value === 'string') {
      formatted = `*${value}*`
    } else if (typeof value === 'number') {
      formatted = String(value)
    } else if (typeof value === 'boolean') {
      formatted = value ? 'T' : 'F'
    } else if (Array.isArray(value)) {
      const items = value.map(item => {
        if (typeof item === 'string') return `*${item}*`
        if (typeof item === 'boolean') return item ? 'T' : 'F'
        if (typeof item === 'number') return String(item)
        return String(item)
      })
      formatted = `|${items.join(', ')}|`
    } else {
      formatted = String(value)
    }

    fields.push(`*${key}*: ${formatted}`)
  }

  return `[${fields.join(', ')}]`
}

export function isCustomFormat(str) {
  if (!str || typeof str !== 'string') return false
  return validateCustomFormat(str).valid
}