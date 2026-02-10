# 🛡️ Demo Account Password Protection

## Обзор
Тази защита предотвратява промяна на паролите за демо акаунтите на платформата RemontCo.

## Защитени акаунти
- **Demo Consumer**: `demo@remont.co` (парола: `demo123`)
- **Demo Company**: `company-demo@remont.co` (парола: `demo123`)

---

## 🔒 Нива на защита

### 1️⃣ Frontend защита (JavaScript)
**Файл**: `src/services/auth.js`

**Какво прави:**
- Блокира `updatePassword()` за демо акаунти
- Блокира `resetPassword()` за демо акаунти
- Показва ясно съобщение на потребителя

**Статус**: ✅ Вече имплементирано

---

### 2️⃣ Database защита (PostgreSQL Trigger)
**Файл**: `database/prevent_demo_password_change.sql`

**Какво прави:**
- Създава database trigger на `auth.users` таблицата
- Блокира всяка промяна на `encrypted_password` за демо акаунти
- Блокира промяна на email за демо акаунти
- Работи на ниво база данни - **НЕ МОЖЕ ДА СЕ ЗАОБИКОЛИ**

**Как да се приложи:**

#### Стъпка 1: Отвори Supabase Dashboard
1. Отиди на https://supabase.com/dashboard
2. Избери проекта си
3. Отиди в **SQL Editor**

#### Стъпка 2: Изпълни SQL скрипта
1. Копирай съдържанието на `database/prevent_demo_password_change.sql`
2. Постави го в SQL Editor
3. Кликни **Run** или натисни `Ctrl + Enter`

#### Стъпка 3: Провери дали работи
Изпълни следната заявка за проверка:
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'prevent_demo_password_change_trigger';
```

Трябва да видиш 1 ред с информация за trigger-а.

#### Стъпка 4: Тествай защитата (опционално)
Опитай да промениш парола на демо акаунт:
```sql
UPDATE auth.users 
SET encrypted_password = 'test' 
WHERE email = 'demo@remont.co';
```

Трябва да получиш грешка:
```
ERROR: Password changes are not allowed for demo accounts: demo@remont.co
HINT: Demo accounts have fixed passwords for security reasons
```

---

### 3️⃣ Edge Function защита (Supabase Functions)
**Файл**: `supabase/functions/prevent-demo-password-change/index.ts`

**Какво прави:**
- Допълнителна защита чрез Supabase Edge Function
- Може да се използва като webhook за auth events

**Статус**: ⚠️ Опционално (Database Trigger е достатъчен)

**Как да се deploy-не** (ако искаш):
```bash
# От root директорията на проекта
npx supabase functions deploy prevent-demo-password-change
```

---

## 🧪 Тестване

### Тест 1: Опит за промяна на парола от UI
1. Логни се като `demo@remont.co` / `demo123`
2. Отиди в Profile → Change Password
3. Опитай да промениш паролата
4. Трябва да видиш съобщение: "Demo account passwords cannot be changed..."

### Тест 2: Опит за Forgot Password
1. Отиди на Login страницата
2. Кликни "Forgot Password"
3. Въведи `demo@remont.co`
4. Трябва да видиш съобщение: "Password reset is not available for demo accounts..."

### Тест 3: Директна database заявка
```sql
-- Това трябва да FAIL-не
UPDATE auth.users 
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'demo@remont.co';
```

### Тест 4: Supabase Auth API
```javascript
// Това трябва да FAIL-не
const { error } = await supabase.auth.updateUser({
  password: 'newpassword123'
});
console.log(error); // Трябва да има error
```

---

## 📊 Сигурност

| Метод на атака | Frontend защита | Database Trigger | Резултат |
|----------------|-----------------|------------------|----------|
| UI Change Password | ✅ Блокирано | ✅ Блокирано | 🛡️ Защитено |
| UI Forgot Password | ✅ Блокирано | ✅ Блокирано | 🛡️ Защитено |
| Developer Console API | ❌ Може да се заобиколи | ✅ Блокирано | 🛡️ Защитено |
| Direct SQL UPDATE | ❌ Няма достъп | ✅ Блокирано | 🛡️ Защитено |
| Supabase Dashboard | ❌ Няма достъп | ✅ Блокирано | 🛡️ Защитено |

---

## ⚠️ Важни бележки

1. **Database Trigger е най-важен** - Той е единствената защита, която НЕ може да се заобиколи
2. **Frontend защитата е за UX** - Тя показва ясни съобщения на потребителите
3. **Демо паролите са видими в кода** - Това е OK, защото те са публични демо акаунти
4. **Trigger-ът работи и за email промени** - Демо акаунтите не могат да променят имейлите си

---

## 🔧 Maintenance

### Как да добавиш нов демо акаунт
1. Добави имейла в `DEMO_EMAILS` масива в `src/services/auth.js`
2. Добави имейла в `is_demo_account()` функцията в SQL скрипта
3. Изпълни отново SQL скрипта в Supabase

### Как да премахнеш защитата (ако е нужно)
```sql
DROP TRIGGER IF EXISTS prevent_demo_password_change_trigger ON auth.users;
DROP FUNCTION IF EXISTS prevent_demo_password_change();
DROP FUNCTION IF EXISTS is_demo_account(TEXT);
```

---

## 📝 Changelog

### 2026-02-10
- ✅ Създадена frontend защита в `auth.js`
- ✅ Създаден database trigger за блокиране на промени
- ✅ Добавена защита за Forgot Password
- ✅ Създадена документация

---

## 🆘 Support

Ако имаш проблеми:
1. Провери дали trigger-ът е активен (виж Стъпка 3 по-горе)
2. Провери Supabase logs за грешки
3. Тествай с SQL заявка директно

---

**Автор**: Teodor Chupetlov  
**Дата**: 10 Февруари 2026  
**Версия**: 1.0
