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

  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    const inner = trimmed.slice(1, -1)
    if (!inner.trim()) return []

    return inner.split(',').map(item => {
      const clean = item.trim()
      if (clean.startsWith('*') && clean.endsWith('*')) return clean.slice(1, -1)
      if (clean === 'T') return true
      if (clean === 'F') return false
      if (!isNaN(clean) && clean !== '') return Number(clean)
      return clean
    })
  }

  if (trimmed === 'T') return true
  if (trimmed === 'F') return false

  if (!isNaN(trimmed) && trimmed !== '') {
    return Number(trimmed)   
  }

  if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
    return trimmed.slice(1, -1)  
  }

  return trimmed
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

  if (!content.includes(':')) {
    return { valid: false, error: 'Не найдено ни одного поля с двоеточием (ключ: значение)' }
  }

  const keyPattern = /\*[^*]+\*/g
  if (!keyPattern.test(content)) {
    return { valid: false, error: 'Не найдено ни одного имени поля в звёздочках' }
  }

  const valuePattern = /:\s*[^,]+/g
  if (!valuePattern.test(content)) {
    return { valid: false, error: 'Не найдено ни одного значения после двоеточия' }
  }

  const fields = splitFields(content)
  
  if (fields.length === 0) {
    return { valid: false, error: 'Не найдено ни одного поля' }
  }


  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    const fieldNumber = i + 1

    if (!field.trim()) {
      return { valid: false, error: `Поле №${fieldNumber} пустое` }
    }

    const colonIndex = field.indexOf(':')
    if (colonIndex === -1) {
      return { 
        valid: false, 
        error: `В поле №${fieldNumber} "${field}" нет двоеточия. Формат: *имя*: значение` 
      }
    }

    const colonCount = (field.match(/:/g) || []).length
    if (colonCount > 1) {
      return { 
        valid: false, 
        error: `В поле №${fieldNumber} "${field}" несколько двоеточий. Должно быть только одно` 
      }
    }

    const keyPart = field.slice(0, colonIndex).trim()
    const valuePart = field.slice(colonIndex + 1).trim()

    if (!keyPart) {
      return { valid: false, error: `В поле №${fieldNumber} отсутствует имя поля` }
    }

    if (!keyPart.startsWith('*') || !keyPart.endsWith('*')) {
      return { 
        valid: false, 
        error: `Имя поля "${keyPart}" должно быть в звёздочках: *${keyPart}*` 
      }
    }

    const keyInner = keyPart.slice(1, -1)
    if (!keyInner.trim()) {
      return { 
        valid: false, 
        error: `Имя поля "${keyPart}" не может быть пустым` 
      }
    }

    if (/\s/.test(keyInner)) {
      return { 
        valid: false, 
        error: `Имя поля "${keyPart}" не должно содержать пробелов. Используйте: *${keyInner.replace(/\s/g, '')}*` 
      }
    }

    if (!valuePart) {
      return { 
        valid: false, 
        error: `В поле "${keyPart}" отсутствует значение` 
      }
    }

    if (!valuePart.startsWith('|')) {
      const hasCommaSpace = /,\s*,/.test(valuePart)
      if (hasCommaSpace) {
        return { 
          valid: false, 
          error: `В значении поля "${keyPart}" лишние запятые: "${valuePart}"` 
        }
      }
    }

    if (valuePart.startsWith('|') && valuePart.endsWith('|')) {
      const inner = valuePart.slice(1, -1)
      
      if (!inner.trim()) {
        return { 
          valid: false, 
          error: `Массив в поле "${keyPart}" не может быть пустым` 
        }
      }

      const items = inner.split(',').map(s => s.trim())
      
      for (let j = 0; j < items.length; j++) {
        const item = items[j]
        const itemNumber = j + 1
        
        if (!item) {
          return { 
            valid: false, 
            error: `❌ Элемент №${itemNumber} в массиве "${keyPart}" не может быть пустым` 
          }
        }

        const isString = item.startsWith('*') && item.endsWith('*')
        const isNumber = !isNaN(item) && item !== ''
        const isBoolean = item === 'T' || item === 'F'

        if (!isString && !isNumber && !isBoolean) {
          return { 
            valid: false, 
            error: `Элемент "${item}" в массиве "${keyPart}" должен быть в звёздочках (строка), числом или T/F` 
          }
        }

        if (isString) {
          const innerItem = item.slice(1, -1)
          if (!innerItem.trim()) {
            return { 
              valid: false, 
              error: `Элемент "${item}" в массиве "${keyPart}" не может быть пустым внутри звёздочек` 
            }
          }
        }
      }
    }

    else if (!isNaN(valuePart) && valuePart.trim() !== '') {
      if (valuePart.startsWith('*') && valuePart.endsWith('*')) {
        return { 
          valid: false, 
          error: `❌ Число "${valuePart}" не должно быть в звёздочках. Введите просто число: ${valuePart.replace(/\*/g, '')}` 
        }
      }
      
      if (/[a-zA-Z]/.test(valuePart)) {
        return { 
          valid: false, 
          error: `"${valuePart}" не является числом. Уберите буквы` 
        }
      }

      const dotCount = (valuePart.match(/\./g) || []).length
      if (dotCount > 1) {
        return { 
          valid: false, 
          error: `Число "${valuePart}" содержит несколько десятичных точек` 
        }
      }
    }

    else if (valuePart === 'T' || valuePart === 'F') {
      if (valuePart.startsWith('*') && valuePart.endsWith('*')) {
        return { 
          valid: false, 
          error: `Булево значение "${valuePart}" не должно быть в звёздочках. Используйте просто T или F` 
        }
      }
    }

    else {
      if (!valuePart.startsWith('*') || !valuePart.endsWith('*')) {
        return { 
          valid: false, 
          error: `Строка "${valuePart}" должна быть в звёздочках: *${valuePart}*` 
        }
      }

      const stringInner = valuePart.slice(1, -1)
      if (!stringInner.trim()) {
        return { 
          valid: false, 
          error: `Строка "${valuePart}" не может быть пустой внутри звёздочек` 
        }
      }

      if (stringInner.includes(',')) {
        return { 
          valid: false, 
          error: `Строка "${stringInner}" не может содержать запятые. Используйте массив: |*${stringInner.replace(/,/g, '*, *')}*|` 
        }
      }
    }
  }

  return { valid: true, error: null }
}


export function parseCustomFormat(str) {
  const validation = validateCustomFormat(str)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const content = str.slice(1, -1)
  if (!content.trim()) return {}

  const fields = splitFields(content)
  const result = {}

  for (const field of fields) {
    const colonIndex = field.indexOf(':')
    if (colonIndex === -1) {
      throw new Error(`Неверный формат поля: "${field}" (нет двоеточия)`)
    }

    const keyPart = field.slice(0, colonIndex).trim()
    const valuePart = field.slice(colonIndex + 1).trim()

    const key = keyPart.replace(/\*/g, '')
    const value = parseValue(valuePart)

    result[key] = value
  }

  return result
}

export function stringifyCustomFormat(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Ожидается объект для преобразования')
  }

  const fields = []

  for (const [key, value] of Object.entries(obj)) {
    let formattedValue

    if (typeof value === 'string') {
      formattedValue = `*${value}*`
    } else if (typeof value === 'number') {
      formattedValue = String(value)
    } else if (typeof value === 'boolean') {
      formattedValue = value ? 'T' : 'F'
    } else if (Array.isArray(value)) {
      const items = value.map(item => {
        if (typeof item === 'string') return `*${item}*`
        if (typeof item === 'boolean') return item ? 'T' : 'F'
        if (typeof item === 'number') return String(item)
        return String(item)
      })
      formattedValue = `|${items.join(', ')}|`
    } else if (value === null) {
      formattedValue = 'null'
    } else {
      formattedValue = String(value)
    }

    fields.push(`*${key}*: ${formattedValue}`)
  }

  return `[${fields.join(', ')}]`
}

export function isCustomFormat(str) {
  if (!str || typeof str !== 'string') return false
  const validation = validateCustomFormat(str)
  return validation.valid
}