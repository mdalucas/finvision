# FinVision - Sistema de Controle Financeiro

FinVision é uma aplicação web moderna desenvolvida em Angular para controle financeiro pessoal, oferecendo uma interface intuitiva e responsiva para gerenciar receitas, despesas e parcelamentos.

## 🚀 Características

### Dashboard Principal
- **3 Colunas Responsivas**: Entradas, Saídas e Cash Flow
- **Filtro por Mês/Ano**: Visualização de dados por período específico
- **Cálculos Automáticos**: Somas e saldo do mês em tempo real
- **Interface Responsiva**: Adaptação perfeita para desktop e mobile

### Funcionalidades

#### 💰 Gerenciamento de Transações
- Criação de entradas (receitas) e saídas (despesas)
- Categorização de transações
- Controle de visibilidade no dashboard
- Edição e exclusão de registros
- Validações de formulário

#### 📅 Calendário Financeiro
- Visualização mensal interativa
- Adição de transações por data
- Filtro por categorias
- Indicadores visuais de saldo diário
- Navegação entre meses

#### 💳 Controle de Parcelas
- Criação de planos de parcelamento
- Visualização em tabela mês a mês
- Cálculo automático de parcelas
- Exportação para CSV
- Separação do dashboard principal (evita dupla contagem)

### 🎨 Interface e UX
- Design moderno com Bootstrap 5
- Ícones Font Awesome
- Animações suaves
- Feedback visual consistente
- Acessibilidade (ARIA labels)

## 🛠️ Tecnologias Utilizadas

- **Angular 20+**: Framework principal
- **TypeScript**: Linguagem de programação
- **Bootstrap 5**: Framework CSS
- **ng-bootstrap**: Componentes Angular para Bootstrap
- **Font Awesome**: Biblioteca de ícones
- **RxJS**: Programação reativa
- **Local Storage**: Persistência de dados

## 📁 Estrutura do Projeto

```
finvision/
├── src/
│   ├── app/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── transaction-modal/
│   │   │   │   └── installment-modal/
│   │   │   ├── models/
│   │   │   │   └── transaction.model.ts
│   │   │   └── services/
│   │   │       ├── finance.service.ts
│   │   │       └── persistence.service.ts
│   │   └── views/
│   │       ├── main-dashboard/
│   │       ├── calendar/
│   │       └── installments/
│   ├── styles.scss
│   └── index.html
├── package.json
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 18+)
- npm ou yarn

### Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd finvision
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute o projeto**
   ```bash
   npm start
   # ou
   ng serve
   ```

4. **Acesse a aplicação**
   - Abra o navegador em `http://localhost:4200`

### Scripts Disponíveis

```bash
npm start          # Executa o servidor de desenvolvimento
npm run build      # Gera build de produção
npm test           # Executa os testes unitários
npm run watch      # Build em modo watch
```

## 💾 Persistência de Dados

Os dados são armazenados localmente no navegador usando **localStorage**, permitindo:

- ✅ Funcionamento offline
- ✅ Dados persistem entre sessões
- ✅ Não requer backend
- ✅ Fácil migração futura para API REST

### Estrutura dos Dados

```typescript
// Transações
interface Transaction {
  id: string;
  title: string;
  value: number;
  date: string;
  category?: string;
  type: 'income' | 'expense';
  showOnDashboard: boolean;
  installmentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Parcelamentos
interface InstallmentPlan {
  id: string;
  title: string;
  totalValue: number;
  installmentValue?: number;
  count: number;
  startDate: string;
  category?: string;
  showOnDashboard: boolean;
  createdAt?: string;
}
```

## 🧪 Testes

O projeto inclui testes unitários para:

- ✅ **FinanceService**: Lógica de negócio e persistência
- ✅ **MainDashboard**: Comportamentos do componente principal
- ✅ Cálculos de totais e cash flow
- ✅ Filtros e operações CRUD

Para executar os testes:
```bash
npm test
```

## 📱 Responsividade

A aplicação é totalmente responsiva:

- **Desktop**: Layout com 3 colunas lado a lado
- **Tablet**: Colunas empilhadas com layout otimizado
- **Mobile**: Interface compacta com navegação touch-friendly

## 🔧 Arquitetura

### Serviços

#### FinanceService
- Gerenciamento centralizado de transações e parcelamentos
- Observables para reatividade
- Cálculos de totais e cash flow
- Abstração da persistência

#### PersistenceService
- Wrapper para localStorage
- Preparado para migração para API REST
- Tratamento de erros

### Componentes

#### Modais Reutilizáveis
- **TransactionModal**: Criação/edição de transações
- **InstallmentModal**: Criação de parcelamentos
- Validações integradas
- Experiência de usuário consistente

#### Views
- **Dashboard**: Visão geral financeira
- **Calendar**: Controle por data
- **Installments**: Gestão de parcelas

## 🚀 Próximos Passos

### Funcionalidades Planejadas
- [ ] Categorias customizáveis
- [ ] Relatórios e gráficos
- [ ] Backup/restauração de dados
- [ ] Metas financeiras
- [ ] Notificações de vencimento

### Melhorias Técnicas
- [ ] Integração com API REST
- [ ] PWA (Progressive Web App)
- [ ] Testes end-to-end
- [ ] CI/CD pipeline
- [ ] Internacionalização (i18n)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub.

---

**FinVision** - Controle financeiro simples e eficiente 💰📊