# Skylish Fluency — Firebase integrado

Esta versão já está preparada para o projeto Firebase `skylish-fluency`.

## Recursos conectados

- cadastro real com nome, e-mail e senha;
- login real;
- recuperação de senha;
- sessão persistente;
- perfil do usuário em `users`;
- painel do professor protegido por função;
- aulas em `lessons`;
- avisos em `posts`;
- comentários em `comments`;
- progresso em `users/{uid}/progress`;
- lista de alunos para o professor.

## Conta do professor

A conta que receberá a função de professor é:

```text
biielcooperwinx@gmail.com
```

Na primeira vez:

1. Abra o site.
2. Clique em **Criar conta**.
3. Cadastre esse e-mail com uma senha de pelo menos 6 caracteres.
4. O sistema criará o perfil com `role: teacher`.
5. Depois do login, o Painel do Professor será aberto.

Outros e-mails serão cadastrados como alunos.

## Publicar as regras do Firestore

No Firebase Console:

1. Abra **Firestore Database**.
2. Clique na aba **Regras**.
3. Apague o conteúdo atual.
4. Copie tudo do arquivo:

```text
docs/firestore.rules
```

5. Cole no editor.
6. Clique em **Publicar**.

Sem essas regras, o Firestore em modo de produção bloqueará o site.

## Abrir no VS Code

1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Use **Live Server** no `index.html`.
4. Não abra apenas clicando duas vezes no HTML, pois módulos do Firebase precisam de um servidor local.

## Teste recomendado

1. Cadastre a conta do professor.
2. Crie uma aula e um aviso.
3. Saia.
4. Cadastre outro e-mail como aluno.
5. Verifique se a aula e o aviso aparecem.
6. Marque uma aula como concluída.
7. Atualize a página e confirme que o progresso continua salvo.

## Atualizar no GitHub

```bash
git init
git add .
git commit -m "Integra Firebase Authentication e Firestore"
git branch -M main
git remote add origin https://github.com/Anthony-thhony/skylish-fluency-interface-premium.git
git push -u origin main --force
```
