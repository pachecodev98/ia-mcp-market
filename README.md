# Como executar a Loja FAEX

Passos simples para preparar e iniciar o projeto

Se você só quer colocar o sistema para funcionar na sua máquina, siga os passos abaixo na ordem. O jeito mais simples é usar o Docker, porque ele prepara o frontend, o backend e o banco de dados de uma vez.

## Antes de começar

Confira se o Docker Desktop está instalado e aberto. Você também vai precisar de uma chave da OpenAI.

### 1. Abra a pasta do projeto

Abra um terminal na pasta principal do projeto: onde está o arquivo docker-compose.yml.

### 2. Crie o arquivo de configuração

Na pasta principal, copie o arquivo .env.example e dê o nome .env para a cópia.

Depois, abra o arquivo .env e deixe a conexão com o banco local desta forma:

```
DATABASE_URL=postgresql://lojafaex:lojafaex123@postgres:5432/lojafaex
```

### 3. Escolha como a inteligência artificial vai funcionar

Se você tiver uma chave da OpenAI, coloque a chave no arquivo .env:

```
OPENAI_API_KEY=coloque-sua-chave-aqui
```

### 4. Inicie a aplicação

Com o Docker Desktop aberto, execute o comando abaixo no terminal. Na primeira vez pode demorar alguns minutos, porque as imagens e dependências serão baixadas.

```
docker compose --profile local-db up --build -d
```

### 5. Abra o sistema

Quando o comando terminar, abra o navegador e acesse:

http://localhost:5173

O backend fica disponível em http://localhost:3000. Para conferir se ele está respondendo, acesse http://localhost:3000/health.

