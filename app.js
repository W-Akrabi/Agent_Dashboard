document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(sec => sec.classList.remove('active'));

            const targetId = item.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Dummy Data - Live Activity Feed
    const feedList = document.getElementById('live-feed-list');
    const dummyActivities = [
        { time: 'Just now', agent: 'Writer Agent', msg: 'Started drafting weekly report.' },
        { time: '2m ago', agent: 'Research Agent', msg: 'Found 3 new articles on AI trends.' },
        { time: '15m ago', agent: 'Sales Bot', msg: 'Sent follow-up email to Acme Corp.' },
        { time: '1h ago', agent: 'Orchestrator', msg: 'Spawned Data Analysis sub-agent.' },
        { time: '2h ago', agent: 'QA Agent', msg: 'Flagged UI issue on checkout page.' },
    ];

    if (feedList) {
        dummyActivities.forEach(act => {
            const li = document.createElement('li');
            li.className = 'feed-item';
            li.innerHTML = `
                <div class="feed-time">${act.time}</div>
                <div class="feed-content">
                    <div class="feed-agent">${act.agent}</div>
                    <div class="feed-msg">${act.msg}</div>
                </div>
            `;
            feedList.appendChild(li);
        });
    }

    // Dummy Data - Kanban Board
    const createCard = (title, agent) => {
        return `
            <div class="k-card" draggable="true">
                <div class="k-card-title">${title}</div>
                <div class="k-card-meta">
                    <span class="tag">${agent}</span>
                    <span>High</span>
                </div>
            </div>
        `;
    };

    const backlogCol = document.getElementById('col-backlog');
    if (backlogCol) {
        backlogCol.innerHTML =
            createCard('Analyze competitor pricing', 'Research Agent') +
            createCard('Update monthly invoice templates', 'Finance Agent');

        document.getElementById('col-progress').innerHTML =
            createCard('Drafting blog post on AI', 'Writer Agent');

        document.getElementById('col-approval').innerHTML =
            createCard('Send final email blast', 'Marketing Agent') +
            createCard('Deploy hotfix to prod', 'DevOps Agent');

        document.getElementById('col-done').innerHTML =
            createCard('Scrape newest leads', 'Sales Bot');
    }

    // Dummy Data - Momentum Ranking
    const momentumList = document.getElementById('momentum-tasks');
    const momentumData = [
        { rank: 1, title: 'Prevent churn for Acme Corp', reason: 'Account usage dropped 80% this week. Highly likely to cancel.', priority: 'Critical', pClass: 'priority-critical' },
        { rank: 2, title: 'Review Q3 Marketing Spend', reason: 'Ad campaigns are running 25% over budget in the last 48 hours.', priority: 'High', pClass: 'priority-high' },
        { rank: 3, title: 'Approve new pricing page copy', reason: 'Blocks Writer Agent from publishing to staging.', priority: 'High', pClass: 'priority-high' },
        { rank: 4, title: 'Categorize unknown transaction types', reason: 'Finance Agent needs human input to close out monthly books.', priority: 'Medium', pClass: 'priority-medium' }
    ];

    if (momentumList) {
        momentumData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'm-task-item';
            div.innerHTML = `
                <div class="m-rank">#${item.rank}</div>
                <div class="m-content">
                    <div class="m-title">${item.title}</div>
                    <div class="m-reason">Reason: ${item.reason}</div>
                </div>
                <div class="m-priority ${item.pClass}">${item.priority}</div>
            `;
            momentumList.appendChild(div);
        });
    }

    // Initialize dragging functionality for Kanban
    const cards = document.querySelectorAll('.k-card');
    const columns = document.querySelectorAll('.kanban-cards');
    let draggedItem = null;

    cards.forEach(card => {
        card.addEventListener('dragstart', () => { draggedItem = card; setTimeout(() => card.style.opacity = '0.5', 0); });
        card.addEventListener('dragend', () => { draggedItem = null; card.style.opacity = '1'; });
    });

    columns.forEach(col => {
        col.addEventListener('dragover', e => { e.preventDefault(); col.style.background = 'rgba(255,255,255,0.05)'; });
        col.addEventListener('dragleave', () => col.style.background = 'transparent');
        col.addEventListener('drop', e => { col.style.background = 'transparent'; if (draggedItem) col.appendChild(draggedItem); });
    });
});
