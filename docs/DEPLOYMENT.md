# Развёртывание MARS на удалённом сервере

MARS полностью подготовлен для автономной работы в облаке или на VPS без привязки к локальному компьютеру.

---

## Вариант 1. Развёртывание на VPS через Docker Compose (Рекомендуемый)

### 1. Подготовка сервера
Любой недорогой VPS (Ubuntu 22.04 / 24.04 или Debian) с 1-2 ГБ RAM.
Установите Docker и Docker Compose на сервере:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

### 2. Клонирование репозитория
```bash
git clone <URL_ВАШЕГО_GITHUB_РЕПОЗИТОРИЯ> mars
cd mars
```

### 3. Запуск контейнеров в фоновом режиме
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
После запуска MARS будет работать 24/7 по адресу `http://IP_ВАШЕГО_СЕРВЕРА:3000`.

---

## Вариант 2. Развёртывание в облаке (Railway / Render / Vercel)

### Railway / Render
1. Зарегистрируйтесь на [railway.app](https://railway.app) или [render.com](https://render.com).
2. Нажмите **New Project** -> **Deploy from GitHub Repo**.
3. Выберите ваш репозиторий `MARS`.
4. Добавьте базу данных PostgreSQL в один клик.
5. Приложение развернётся автоматически с бесплатным HTTPS-доменом!

---

## Публикация репозитория на GitHub

Если вы хотите создать удалённый репозиторий прямо сейчас, выполните в терминале:

```powershell
# 1. Авторизация в GitHub (откроется окно в браузере)
gh auth login

# 2. Создание приватного или публичного репозитория на вашем GitHub и отправка кода
gh repo create mars --public --source=. --remote=origin --push
```

Или, если вы уже создали пустой репозиторий на GitHub вручную:
```powershell
git remote add origin https://github.com/<ВАШ_ЛОГИН>/<ИМЯ_РЕПОЗИТОРИЯ>.git
git branch -M main
git push -u origin main
```
