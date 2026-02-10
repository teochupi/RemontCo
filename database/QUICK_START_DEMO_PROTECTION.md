# 🚀 БЪРЗА ИНСТРУКЦИЯ - Защита на демо акаунти

## ⚡ Какво трябва да направиш СЕГА:

### 1. Отвори Supabase Dashboard
👉 https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

### 2. Копирай и изпълни този SQL код:

```sql
-- Създай функция за проверка на демо акаунти
CREATE OR REPLACE FUNCTION is_demo_account(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN LOWER(user_email) IN ('demo@remont.co', 'company-demo@remont.co');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Създай функция за блокиране на промени
CREATE OR REPLACE FUNCTION prevent_demo_password_change()
RETURNS TRIGGER AS $$
BEGIN
  IF is_demo_account(NEW.email) THEN
    IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
      RAISE EXCEPTION 'Password changes are not allowed for demo accounts: %', NEW.email
        USING HINT = 'Demo accounts have fixed passwords for security reasons';
    END IF;
    
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Email changes are not allowed for demo accounts: %', OLD.email
        USING HINT = 'Demo account emails cannot be modified';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Създай trigger
DROP TRIGGER IF EXISTS prevent_demo_password_change_trigger ON auth.users;
CREATE TRIGGER prevent_demo_password_change_trigger
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_demo_password_change();
```

### 3. Провери дали работи:

```sql
-- Това трябва да FAIL-не с грешка
UPDATE auth.users 
SET encrypted_password = 'test' 
WHERE email = 'demo@remont.co';
```

Ако видиш грешка "Password changes are not allowed..." - **ГОТОВО! ✅**

---

## ✅ Какво вече е направено в кода:

1. ✅ Frontend защита в `src/services/auth.js`
2. ✅ Блокиране на "Change Password" в UI
3. ✅ Блокиране на "Forgot Password" в UI

---

## 🎯 Резултат:

След като изпълниш SQL кода по-горе:
- ❌ Никой НЕ може да промени паролата на `demo@remont.co`
- ❌ Никой НЕ може да промени паролата на `company-demo@remont.co`
- ✅ Демо акаунтите винаги ще работят с парола `demo123`
- ✅ Защитата работи на ниво база данни - НЕ може да се заобиколи

---

## 📖 Пълна документация:

Виж `database/DEMO_PROTECTION_README.md` за детайли.

---

**⏱️ Време за имплементация: 2 минути**
