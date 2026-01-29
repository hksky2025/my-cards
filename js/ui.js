// js/ui.js
const UI_Renderer = {
    renderList: (results, mode) => {
        const container = document.getElementById('results-engine-output');
        container.innerHTML = results.map((r, i) => {
            const isBest = i === 0;
            return `
            <div class="bg-white p-5 rounded-[2rem] border-2 ${isBest ? 'border-brand-primary' : 'border-transparent'} shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-brand-dark text-white uppercase tracking-tighter">${r.bank}</span>
                        ${r.isCapped ? '<span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase">Cap reached</span>' : ''}
                    </div>
                    <div class="font-extrabold text-slate-800 text-lg">${r.name}</div>
                    <div class="text-[10px] text-brand-primary font-bold mt-0.5">${r.desc || "基本回贈"}</div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-black text-brand-dark">${r.val}<span class="text-xs ml-1 text-slate-400">${r.unit}</span></div>
                    <div class="flex items-center justify-end gap-1 text-brand-secondary">
                        <i data-lucide="trending-up" class="w-3 h-3"></i>
                        <span class="text-[8px] font-black uppercase tracking-widest">Optimized</span>
                    </div>
                </div>
            </div>`;
        }).join('');
        lucide.createIcons(); // 每次渲染後啟動 Lucide 圖標
    },

    updateStatus: () => {
        const el = document.getElementById('date-status-area');
        const isRed = LogicEngine.checkRedDay();
        el.innerHTML = isRed 
            ? `<div class="flex items-center gap-1 text-red-500 font-bold text-[10px] uppercase tracking-wider"><i data-lucide="calendar-heart" class="w-3 h-3"></i> 🔴 紅日模式 (BOC 5%+)</div>`
            : `<div class="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider"><i data-lucide="calendar" class="w-3 h-3"></i> ⚪ 平日模式 Normal</div>`;
        lucide.createIcons();
    }
};
