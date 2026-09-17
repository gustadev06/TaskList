import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Filter,
  LayoutList,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  checkApi,
  completeTask,
  createTask,
  DEFAULT_API_URL,
  getApiUrl,
  listTasks,
  setApiUrl,
  type Task,
} from "@/lib/api";

type ViewFilter = "all" | "open" | "done";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatToday() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now);
  const date = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(now);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date}`;
}

function TaskRow({ task, onComplete, busy }: { task: Task; onComplete: (task: Task) => void; busy: boolean }) {
  return (
    <div className={cn("task-row group", task.done && "task-row-done")}>
      <button
        type="button"
        aria-label={task.done ? "Tarefa concluída" : `Concluir ${task.title}`}
        className={cn("task-check", task.done && "task-check-done")}
        onClick={() => onComplete(task)}
        disabled={task.done || busy}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : task.done ? <Check className="size-4" strokeWidth={3} /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium tracking-[-0.01em]">{task.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">Tarefa #{String(task.id).padStart(3, "0")}</p>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <span className={cn("task-status", task.done ? "task-status-done" : "task-status-open")}>
          <span className="size-1.5 rounded-full bg-current" />
          {task.done ? "Concluída" : "Em aberto"}
        </span>
        <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}

function StatCard({ label, value, detail, accent }: { label: string; value: number; detail: string; accent: "amber" | "mint" | "ink" }) {
  return (
    <div className={cn("stat-card", `stat-card-${accent}`)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</span>
        <ArrowUpRight className="size-4 opacity-50" />
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <strong className="font-display text-4xl font-medium leading-none tracking-[-0.05em]">{value}</strong>
        <span className="pb-0.5 text-right text-xs font-medium opacity-70">{detail}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [draftApiUrl, setDraftApiUrl] = useState(apiUrl);
  const [checkingApi, setCheckingApi] = useState(false);

  const loadTasks = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await listTasks();
      setTasks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar suas tarefas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const openTasks = tasks.filter((task) => !task.done);
  const doneTasks = tasks.filter((task) => task.done);
  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesFilter = filter === "all" || (filter === "open" ? !task.done : task.done);
      const matchesQuery = !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, tasks]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setSaving(true);
    try {
      const task = await createTask(cleanTitle);
      setTasks((current) => [task, ...current]);
      setTitle("");
      setFilter("all");
      toast.success("Tarefa adicionada", { description: "Já está na sua lista de hoje." });
    } catch (err) {
      toast.error("Não foi possível adicionar", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(task: Task) {
    setBusyTaskId(task.id);
    try {
      const updatedTask = await completeTask(task.id);
      setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)));
      toast.success("Feito. Mais uma para a conta.");
    } catch (err) {
      toast.error("Não foi possível concluir", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleSaveApi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = setApiUrl(draftApiUrl || DEFAULT_API_URL);
    setApiUrlState(normalized);
    setShowSettings(false);
    toast.success("Fonte atualizada", { description: "Testando a conexão com a nova API." });
    await loadTasks();
  }

  async function handleCheckApi() {
    setCheckingApi(true);
    try {
      await checkApi();
      toast.success("API online", { description: "A conexão está respondendo normalmente." });
    } catch (err) {
      toast.error("API indisponível", { description: err instanceof Error ? err.message : "Confira a URL informada." });
    } finally {
      setCheckingApi(false);
    }
  }

  const filters: { label: string; value: ViewFilter; count: number }[] = [
    { label: "Todas", value: "all", count: tasks.length },
    { label: "Em aberto", value: "open", count: openTasks.length },
    { label: "Concluídas", value: "done", count: doneTasks.length },
  ];

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", mobileNav && "sidebar-open")}>
        <div className="sidebar-top">
          <div className="brand-lockup">
            <span className="brand-mark"><span /></span>
            <span className="font-display text-[27px] font-semibold tracking-[-0.06em] text-white">ponto</span>
          </div>
          <button type="button" className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Fechar menu"><X className="size-5" /></button>
          <p className="mt-12 max-w-[170px] text-[13px] leading-5 text-white/48">Um lugar calmo para colocar as coisas em ordem.</p>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          <span className="sidebar-label">Espaço de trabalho</span>
          <button type="button" className="nav-item nav-item-active"><LayoutList className="size-[17px]" /> Minhas tarefas <span className="nav-count">{tasks.length}</span></button>
          <button type="button" className="nav-item" onClick={() => { setFilter("open"); setMobileNav(false); }}><Clock3 className="size-[17px]" /> Em aberto <span className="nav-count">{openTasks.length}</span></button>
          <button type="button" className="nav-item" onClick={() => { setFilter("done"); setMobileNav(false); }}><Check className="size-[17px]" /> Concluídas <span className="nav-count">{doneTasks.length}</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles className="size-4 text-[#e8ad64]" />
            <div><p className="text-xs font-semibold text-white/80">Ritmo sustentável</p><p className="mt-1 text-[11px] leading-4 text-white/42">Uma tarefa de cada vez também é progresso.</p></div>
          </div>
          <button type="button" className="nav-item nav-item-muted" onClick={() => { setDraftApiUrl(apiUrl); setShowSettings(true); setMobileNav(false); }}><Settings2 className="size-[17px]" /> Configurações</button>
          <div className="sidebar-footer"><span className="status-dot" /> <span>Conexão configurada</span></div>
        </div>
      </aside>

      {mobileNav && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button type="button" className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu className="size-5" /></button>
          <div className="topbar-date"><span className="hidden sm:inline">Hoje é </span>{formatToday()}</div>
          <div className="topbar-actions"><button type="button" className="icon-button" aria-label="Ajuda"><CircleHelp className="size-[18px]" /></button><button type="button" className="profile-chip"><span className="profile-avatar">V</span><span className="hidden text-xs font-semibold sm:inline">Visitante</span></button></div>
        </header>

        <div className="content-wrap">
          <section className="welcome-block animate-in">
            <div><p className="eyebrow">Quarta-feira, 16 de setembro</p><h1 className="font-display text-[clamp(2.8rem,5vw,4.6rem)] font-medium leading-[0.96] tracking-[-0.065em] text-[#17282b]">Tudo em um só<br /><em>ponto.</em></h1></div>
            <div className="welcome-copy"><Command className="size-5 text-[#cf744d]" /><p>Seu dia fica mais leve quando o próximo passo está claro.</p></div>
          </section>

          <section className="stats-grid animate-in" style={{ animationDelay: "60ms" }}>
            <StatCard label="No total" value={tasks.length} detail="itens na lista" accent="ink" />
            <StatCard label="Em aberto" value={openTasks.length} detail={openTasks.length === 1 ? "pedindo atenção" : "pedindo atenção"} accent="amber" />
            <StatCard label="Concluídas" value={doneTasks.length} detail="passos adiante" accent="mint" />
          </section>

          <section className="task-panel animate-in" style={{ animationDelay: "120ms" }}>
            <div className="panel-header">
              <div><p className="eyebrow">Seu espaço</p><h2 className="font-display text-[2rem] font-medium tracking-[-0.045em]">Lista de tarefas</h2></div>
              <button type="button" className="refresh-button" onClick={() => void loadTasks(true)} disabled={refreshing} aria-label="Atualizar tarefas"><RefreshCw className={cn("size-4", refreshing && "animate-spin")} /><span className="hidden sm:inline">Atualizar</span></button>
            </div>

            <form className="add-task-form" onSubmit={handleSubmit}>
              <div className="add-task-icon"><Plus className="size-5" /></div>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="O que precisa acontecer?" aria-label="Nova tarefa" maxLength={180} />
              <Button type="submit" disabled={saving || !title.trim()} className="add-button">{saving ? <Loader2 className="size-4 animate-spin" /> : "Adicionar"}</Button>
            </form>

            <div className="task-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filtrar tarefas">
                {filters.map((item) => <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} className={cn("filter-tab", filter === item.value && "filter-tab-active")} onClick={() => setFilter(item.value)}>{item.label}<span>{item.count}</span></button>)}
              </div>
              <label className="search-field"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" aria-label="Buscar tarefas" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca"><X className="size-3.5" /></button>}</label>
            </div>

            <div className="task-list">
              {loading ? <div className="loading-state"><Loader2 className="size-5 animate-spin text-[#cf744d]" /><span>Organizando sua lista...</span></div> : error ? <div className="error-state"><div className="error-icon">!</div><div><p className="font-semibold">Não conseguimos chegar até a sua lista.</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><button type="button" className="error-link" onClick={() => { setDraftApiUrl(apiUrl); setShowSettings(true); }}>Revisar conexão <ArrowUpRight className="size-3.5" /></button></div></div> : visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon"><Filter className="size-5" /></div><p className="font-display text-2xl">Nada por aqui ainda.</p><p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">{query ? "Tente outra busca ou limpe o filtro." : filter === "done" ? "As tarefas concluídas aparecem aqui." : "Adicione o primeiro passo e comece o dia."}</p></div> : visibleTasks.map((task) => <TaskRow key={task.id} task={task} busy={busyTaskId === task.id} onComplete={handleComplete} />)}
            </div>
            {!loading && !error && visibleTasks.length > 0 && <p className="list-footnote"><span>{visibleTasks.length} {visibleTasks.length === 1 ? "tarefa visível" : "tarefas visíveis"}</span><span className="footnote-separator">·</span><span>{apiUrl.replace(/^https?:\/\//, "")}</span></p>}
          </section>
        </div>
      </main>

      {showSettings && <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button className="modal-backdrop" aria-label="Fechar configurações" onClick={() => setShowSettings(false)} /><div className="settings-modal"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Configuração</p><h2 id="settings-title" className="font-display text-3xl tracking-[-0.05em]">Fonte de dados</h2></div><button type="button" className="icon-button" onClick={() => setShowSettings(false)} aria-label="Fechar"><X className="size-[18px]" /></button></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Informe o endereço onde sua API Express está rodando. O valor fica salvo neste navegador.</p><form className="mt-7" onSubmit={handleSaveApi}><label className="field-label" htmlFor="api-url">URL da API</label><Input id="api-url" value={draftApiUrl} onChange={(event) => setDraftApiUrl(event.target.value)} placeholder={DEFAULT_API_URL} className="mt-2" autoFocus /><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" className="check-connection" onClick={() => void handleCheckApi()} disabled={checkingApi}>{checkingApi ? <Loader2 className="size-4 animate-spin" /> : <CircleHelp className="size-4" />} Testar conexão</button><Button type="submit">Salvar endereço</Button></div></form></div></div>}
    </div>
  );
}
