// app.js

const STORAGE_KEY_HABITS = 'habitQuestHabits';
const STORAGE_KEY_STATS = 'habitQuestStats';

// --- 1. Estado Inicial do Jogo ---
const INITIAL_STATS = {
    points: 0,
    level: 1,
    xpForNextLevel: 100, // XP necessário para o Nível 2
    lastCompletionDate: new Date().toISOString().split('T')[0] // Garante que a checagem inicial ocorra
};

// --- 2. Funções de Persistência (LocalStorage) ---

const getHabits = () => {
    const habits = localStorage.getItem(STORAGE_KEY_HABITS);
    return habits ? JSON.parse(habits) : [];
};

const saveHabits = (habits) => {
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
};

const getStats = () => {
    const stats = localStorage.getItem(STORAGE_KEY_STATS);
    // Combina as estatísticas salvas com os valores padrão para evitar erros
    return stats ? { ...INITIAL_STATS, ...JSON.parse(stats) } : INITIAL_STATS;
};

const saveStats = (stats) => {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
};

// --- 3. Lógica de Gamificação (Core) ---

const checkLevelUp = (stats) => {
    let newLevel = stats.level;
    let newXpForNextLevel = stats.xpForNextLevel;

    // Enquanto os pontos ultrapassarem o requisito de XP para o próximo nível
    while (stats.points >= newXpForNextLevel) {
        // Reduz os pontos pelo custo do nível
        stats.points -= newXpForNextLevel;
        newLevel++;

        // Aumenta o custo de XP para o próximo nível (Ex: 100, 200, 300...)
        newXpForNextLevel = newLevel * 100;

        alert(`⭐ Parabéns! Você alcançou o Nível ${newLevel}!\nSeu herói está mais forte!`);
    }

    stats.level = newLevel;
    stats.xpForNextLevel = newXpForNextLevel;
    return stats;
};

const completeHabit = (id) => {
    let habits = getHabits();
    let stats = getStats();
    
    // Encontra o hábito
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1 || habits[habitIndex].completedToday) return;

    const habit = habits[habitIndex];

    // Marca como completado e atualiza a data
    habit.completedToday = true;
    habit.lastCompleted = new Date().toISOString().split('T')[0];
    
    // Adiciona XP
    stats.points += habit.reward;
    stats = checkLevelUp(stats); // Checa se houve Level Up

    saveHabits(habits);
    saveStats(stats);
    renderAll();
};

// --- 4. Lógica de Reinicialização Diária ---

const checkAndResetDaily = () => {
    let stats = getStats();
    const today = new Date().toISOString().split('T')[0];
    
    // Se a última data de conclusão for anterior a hoje, reinicia os hábitos
    if (stats.lastCompletionDate !== today) {
        let habits = getHabits();
        
        habits.forEach(habit => {
            // Reseta o status de conclusão para o novo dia
            habit.completedToday = false; 
        });

        stats.lastCompletionDate = today; 
        saveHabits(habits);
        saveStats(stats); // Salva o novo 'lastCompletionDate'
        renderAll();
    }
};

// --- 5. Renderização (UI) ---

const renderStats = (stats) => {
    const points = stats.points;
    const level = stats.level;
    const xpForNextLevel = stats.xpForNextLevel;

    // XP acumulado (para a barra de progresso)
    let currentLevelXP = points; 
    let xpNeeded = xpForNextLevel;
    
    // Se o jogador já passou de nível, precisamos calcular o XP dentro do nível atual
    if (level > 1) {
        // Calcula o XP total acumulado em todos os níveis anteriores
        let xpTotalPastLevels = 0;
        for (let i = 1; i < level; i++) {
            xpTotalPastLevels += i * 100; // XP total gasto para chegar ao nível
        }
        currentLevelXP = points - xpTotalPastLevels; // XP restante para o nível atual
        xpNeeded = level * 100; // XP necessário para o próximo nível
    }

    // Garante que o XP exibido na barra esteja correto (pode ser o XP total se for Nível 1)
    currentLevelXP = (points < 100 && level === 1) ? points : currentLevelXP;
    
    // Preenche os elementos
    document.getElementById('player-level').textContent = `Nível ${level}`;
    document.getElementById('player-points').textContent = points; 

    // Calcula a porcentagem de progresso
    const progressPercent = Math.min(100, (currentLevelXP / xpNeeded) * 100);

    document.getElementById('xp-fill').style.width = `${progressPercent}%`;
    document.getElementById('xp-text').textContent = `${currentLevelXP} / ${xpNeeded} XP`;
};

const renderHabits = () => {
    const habits = getHabits();
    const list = document.getElementById('habit-list');
    
    list.innerHTML = ''; 

    if (habits.length === 0) {
        document.getElementById('no-habits-msg').style.display = 'block';
        return;
    }
    document.getElementById('no-habits-msg').style.display = 'none';

    habits.forEach(habit => {
        const item = document.createElement('div');
        item.classList.add('habit-item');
        if (habit.completedToday) {
            item.classList.add('completed');
        }

        item.innerHTML = `
            <div class="habit-item-info">
                <h3>${habit.name}</h3>
                <p>Recompensa: <i class="fas fa-coins"></i> ${habit.reward} XP</p>
            </div>
            <button class="complete-btn" 
                    data-id="${habit.id}" 
                    ${habit.completedToday ? 'disabled' : ''}>
                ${habit.completedToday ? 'Concluído!' : 'Concluir Missão'}
            </button>
        `;
        list.appendChild(item);
    });

    // Adiciona o Listener para os botões de conclusão (delegação de eventos)
    list.querySelectorAll('.complete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            completeHabit(id);
        });
    });
};

const renderAll = () => {
    renderStats(getStats());
    renderHabits();
};

// --- 6. Event Listeners e Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Checa e reseta hábitos se for um novo dia
    checkAndResetDaily(); 
    
    // 2. Inicializa o painel e a lista
    renderAll();

    // 3. Listener do Formulário de Cadastro de Hábito
    document.getElementById('habit-form').addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const name = document.getElementById('habit-name').value.trim();
        const reward = parseInt(document.getElementById('habit-reward').value);

        if (name && reward > 0) {
            let habits = getHabits();
            
            const newHabit = {
                id: Date.now(),
                name: name,
                reward: reward,
                completedToday: false,
                lastCompleted: null
            };

            habits.push(newHabit);
            saveHabits(habits);
            renderHabits();
            e.target.reset(); 
        } else {
            alert('Por favor, preencha o nome do hábito e uma recompensa (XP) válida.');
        }
    });
});