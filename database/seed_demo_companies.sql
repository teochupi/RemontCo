-- Скрипт за добавяне на 5 случайни (демо) фирми
-- Можете да изпълните този код в SQL Editor на Supabase

INSERT INTO public.companies (owner_id, name, eik, address, city, phone, email, description, is_verified, status)
VALUES 
((SELECT id FROM public.profiles WHERE username = 'teoch' LIMIT 1), 'Ремонт Експрес ООД', '123456789', 'ул. Софийска 10', 'София', '0888111222', 'info@remontexpress.bg', 'Специалисти в бързите вътрешни ремонти и боядисване.', true, 'approved'),
((SELECT id FROM public.profiles WHERE username = 'teoch' LIMIT 1), 'ВиК Мастер ЕООД', '987654321', 'жк. Тракия бл. 5', 'Пловдив', '0888333444', 'contact@vikmaster.bg', 'Цялостно изграждане и ремонт на ВиК инсталации.', true, 'approved'),
((SELECT id FROM public.profiles WHERE username = 'teoch' LIMIT 1), 'БилдПро България', '112233445', 'бул. България 100', 'София', '0888555666', 'sales@buildpro.bg', 'Строителство на еднофамилни къщи и груб строеж.', true, 'approved'),
((SELECT id FROM public.profiles WHERE username = 'teoch' LIMIT 1), 'ЕлСистемс Груп', '554433221', 'ул. Струма 3', 'Варна', '0888777888', 'office@elsystems.bg', 'Проектиране и монтаж на електрически инсталации и осветление.', true, 'approved'),
((SELECT id FROM public.profiles WHERE username = 'teoch' LIMIT 1), 'Покриви Топ', '667788990', 'ул. Родопи 15', 'Стара Загора', '0888999000', 'roof@top.bg', 'Ремонт на покриви и хидроизолация с 10 години гаранция.', true, 'approved');
