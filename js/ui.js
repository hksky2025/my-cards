// js/ui.js
const UI = {
    renderResults: (results, mode) => {
        const container = document.getElementById('results');
        if (results.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-400 py-10 text-sm">請到設定頁面剔選持有的信用卡</div>`;
            return;
        }

        container.innerHTML = results.map((r, index) => {
            const isTop = index === 0;
            const bankColors = { "HSBC": "bg-red-600", "BOC": "bg-red-800", "HASE": "bg-green-700", "SC": "bg-blue-600", "Mox": "bg-black", "CNCBI": "bg-blue-800" };
            const bankClass = bankColors[r.bank] || "bg-gray-600";

            return `
            <div class="bg-white p-4 rounded-2xl shadow-sm border-2 ${isTop ? 'border-blue-500 scale-[1.02]' : 'border-transparent'} flex justify-between items-center transition-all duration-300">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase ${bankClass}">${r.bank}</span>
                        ${isTop ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-400 text-yellow-900 animate-pulse">🏆 最佳</span>' : ''}
                    </div>
                    <div class="font-bold text-gray-800 text-lg">${r.name}</div>
                    <div class="text-[10px] text-blue-500 font-medium mt-1 leading-tight">${r.desc}</div>
                </div>
                <div class="text-right ml-4">
                    <div class="text-[10px] text-gray-400 font-bold mb-1">${mode === 'miles' ? '里數' : '淨回贈'}</div>
                    <div class="text-2xl font-black ${isTop ? 'text-blue-600' : 'text-gray-700'}">
                        ${r.val}<span class="text-xs ml-0.5">${r.unit}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    updateHolidayStatus: () => {
        const now = new Date();
        const isSunday = now.getDay() === 0;
        const el = document.getElementById('holiday-status');
        if (isSunday) {
            el.innerHTML = `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 border border-red-200">🔴 今日紅日 (BOC/Motion 5%+ 生效)</span>`;
        } else {
            el.innerHTML = `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100 font-medium">⚪ 平日模式</span>`;
        }
    }
};