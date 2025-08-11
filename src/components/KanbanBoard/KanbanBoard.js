// KanbanBoard.js
import React, { useState, useEffect, useMemo } from "react";
import styles from "./KanbanBoard.module.css"; // Import the CSS Module

// A simple utility to generate unique IDs like T-001
const generateUniqueId = (prefix = "T", num = 1) => {
    return `${prefix}-${String(num).padStart(3, "0")}`;
};

// A simple utility for a debounced save to localStorage
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const TaskCard = ({ task, columnId, onOpenModal }) => {
    if (!task || task.archived) return null;

    const isPastDue = task.dueDate && new Date(task.dueDate) < new Date();
    const daysUntilDue = task.dueDate
        ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;
    const isDueSoon =
        daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

    // Color and symbol mapping for complexity and topics
    const complexityColors = {
        low: "#28a745",
        medium: "#ffc107",
        high: "#dc3545",
    };
    const complexitySymbols = { low: "🟢", medium: "🟡", high: "🔴" };
    const topicColors = {
        Work: "#007bff",
        Personal: "#20c997",
        "Home Project": "#17a2b8",
    };
    const topicSymbols = { Work: "💼", Personal: "🏠", "Home Project": "🛠️" };

    const taskCardClass = `${styles.taskCard} ${isPastDue ? styles.pastDue : ""} ${
        isDueSoon ? styles.dueSoon : ""
    }`;

    return (
        <div
            className={taskCardClass}
            onClick={() => onOpenModal(task)}
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", task.id);
                e.dataTransfer.setData("sourceColumnId", columnId);
            }}
        >
            <div className={styles.taskCardContent}>
                <h4>{task.summary}</h4>
                {task.dueDate && <p className={styles.dueDate}>Due: {task.dueDate}</p>}
                <span className={styles.taskId}>{task.id}</span>
            </div>
        </div>
    );
};

const TaskModal = ({
    task,
    topics,
    onClose,
    onUpdateTask,
    onDeleteTask,
    onArchiveTask,
}) => {
    const [localTask, setLocalTask] = useState(task);

    const handleLocalUpdate = (field, value) => {
      setLocalTask(prev => ({...prev, [field]: value}));
    }

    const handleSave = () => {
      onUpdateTask(localTask);
      onClose();
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeModalBtn} onClick={onClose}>
                    ×
                </button>
                <div className={styles.modalHeader}>
                    <input
                        type="text"
                        value={localTask.summary}
                        onChange={(e) => handleLocalUpdate('summary', e.target.value)}
                        className={styles.modalTitleInput}
                    />
                </div>
                <div className={styles.modalContent}>
                    <div className={styles.fieldGroup}>
                        <label>Description</label>
                        <textarea
                            value={localTask.description}
                            onChange={(e) => handleLocalUpdate('description', e.target.value)}
                            className={styles.textInput}
                        />
                    </div>
                    <div className={styles.fieldGroupRow}>
                        <label>Complexity</label>
                        <select
                            value={localTask.complexity}
                            onChange={(e) => handleLocalUpdate('complexity', e.target.value)}
                            className={styles.textInput}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroupRow}>
                        <label>Category</label>
                        <select
                            value={localTask.category}
                            onChange={(e) => handleLocalUpdate('category', e.target.value)}
                            className={styles.textInput}
                        >
                            {topics.map((topic) => (
                                <option key={topic} value={topic}>
                                    {topic}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.fieldGroupRow}>
                        <label>Due Date</label>
                        <input
                            type="date"
                            value={localTask.dueDate}
                            onChange={(e) => handleLocalUpdate('dueDate', e.target.value)}
                            className={styles.textInput}
                        />
                    </div>

                    <div className={styles.modalActions}>
                        <button
                            onClick={() => onDeleteTask(localTask.id)}
                            className={`${styles.btn} ${styles.btnDanger}`}
                        >
                            Delete Task
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={() => onArchiveTask(localTask.id, !localTask.archived)}
                        >
                            {localTask.archived ? "Unarchive" : "Archive Task"}
                        </button>
                        <button
                            onClick={handleSave}
                            className={`${styles.btn} ${styles.btnPrimary}`}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewTaskModal = ({ topics, onClose, onCreateTask }) => {
    const [taskSummary, setTaskSummary] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskComplexity, setTaskComplexity] = useState("low");
    const [taskCategory, setTaskCategory] = useState(topics[0] || "");
    const [taskDueDate, setTaskDueDate] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateTask({
            summary: taskSummary,
            description: taskDescription,
            complexity: taskComplexity,
            category: taskCategory,
            dueDate: taskDueDate,
        });
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeModalBtn} onClick={onClose}>
                    ×
                </button>
                <h2>Create New Task</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="summary">Summary</label>
                        <input
                            id="summary"
                            type="text"
                            value={taskSummary}
                            onChange={(e) => setTaskSummary(e.target.value)}
                            className={styles.textInput}
                            required
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            className={styles.textInput}
                        />
                    </div>
                    <div className={styles.fieldGroupRow}>
                        <label htmlFor="complexity">Complexity</label>
                        <select
                            id="complexity"
                            value={taskComplexity}
                            onChange={(e) => setTaskComplexity(e.target.value)}
                            className={styles.textInput}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroupRow}>
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            value={taskCategory}
                            onChange={(e) => setTaskCategory(e.target.value)}
                            className={styles.textInput}
                        >
                            {topics.map((topic) => (
                                <option key={topic} value={topic}>
                                    {topic}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.fieldGroupRow}>
                        <label htmlFor="dueDate">Due Date</label>
                        <input
                            id="dueDate"
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className={styles.textInput}
                        />
                    </div>
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                        Create Task
                    </button>
                </form>
            </div>
        </div>
    );
};

const SettingsModal = ({
    columns,
    topics,
    newColumnTitle,
    newTopic,
    onAddColumn,
    onRenameColumn,
    onRemoveColumn,
    onNewColumnTitleChange,
    onAddTopic,
    onDeleteTopic,
    onNewTopicChange,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState("columns");

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeModalBtn} onClick={onClose}>
                    ×
                </button>
                <h2>Settings</h2>
                <div className={styles.modalTabs}>
                    <button
                        className={`${styles.tabBtn} ${
                            activeTab === "columns" ? styles.active : ""
                        }`}
                        onClick={() => setActiveTab("columns")}
                    >
                        Manage Columns
                    </button>
                    <button
                        className={`${styles.tabBtn} ${
                            activeTab === "topics" ? styles.active : ""
                        }`}
                        onClick={() => setActiveTab("topics")}
                    >
                        Manage Topics
                    </button>
                </div>
                <div className={styles.tabContent}>
                    {activeTab === "columns" && (
                        <div>
                            <div className={styles.columnSettingsList}>
                                {Object.values(columns).map((column) => (
                                    <div key={column.id} className={styles.columnSettingItem}>
                                        <input
                                            type="text"
                                            value={column.title}
                                            onChange={(e) =>
                                                onRenameColumn(column.id, e.target.value)
                                            }
                                            className={styles.textInput}
                                        />
                                        <button
                                            onClick={() => onRemoveColumn(column.id)}
                                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.addColumnForm}>
                                <input
                                    type="text"
                                    value={newColumnTitle}
                                    onChange={(e) => onNewColumnTitleChange(e.target.value)}
                                    placeholder="New column title"
                                    className={styles.textInput}
                                />
                                <button onClick={onAddColumn} className={`${styles.btn} ${styles.btnPrimary}`}>
                                    Add Column
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === "topics" && (
                        <div>
                            <div className={styles.topicList}>
                                {topics.map((topic) => (
                                    <div key={topic} className={styles.topicItem}>
                                        <span>{topic}</span>
                                        <button
                                            onClick={() => onDeleteTopic(topic)}
                                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.addTopicForm}>
                                <input
                                    type="text"
                                    value={newTopic}
                                    onChange={(e) => onNewTopicChange(e.target.value)}
                                    placeholder="New topic name"
                                    className={styles.textInput}
                                />
                                <button onClick={onAddTopic} className={`${styles.btn} ${styles.btnPrimary}`}>
                                    Add Topic
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const KanbanBoard = () => {
    // --- State Management ---
    const [boardData, setBoardData] = useState(() => {
        const storedData = localStorage.getItem("kanbanBoardData");
        if (storedData) {
            return JSON.parse(storedData);
        }
        return {
            columns: {
                "column-1": {
                    id: "column-1",
                    title: "To Do",
                    taskIds: ["T-001", "T-002"],
                },
                "column-2": {
                    id: "column-2",
                    title: "In Progress",
                    taskIds: ["T-003"],
                },
                "column-3": { id: "column-3", title: "Done", taskIds: [] },
            },
            tasks: {
                "T-001": {
                    id: "T-001",
                    summary: "Build the time management tool",
                    description:
                        "Create a single React component that implements all the required features.",
                    complexity: "high",
                    tags: [],
                    category: "Work",
                    relatedTasks: [],
                    checklist: [],
                    dueDate: "2025-08-30",
                    assignees: [],
                    attachments: [],
                    comments: [],
                    archived: false,
                },
                "T-002": {
                    id: "T-002",
                    summary: "Plan weekend trip",
                    description: "Research destinations and book accommodation.",
                    complexity: "low",
                    tags: [],
                    category: "Personal",
                    relatedTasks: [],
                    checklist: [],
                    dueDate: "2025-08-20",
                    assignees: [],
                    attachments: [],
                    comments: [],
                    archived: false,
                },
                "T-003": {
                    id: "T-003",
                    summary: 'Read "Dune" book',
                    description:
                        'Start reading the book "Dune" before the new movie comes out.',
                    complexity: "medium",
                    tags: [],
                    category: "Personal",
                    relatedTasks: [],
                    checklist: [],
                    dueDate: "2025-09-01",
                    assignees: [],
                    attachments: [],
                    comments: [],
                    archived: false,
                },
            },
            topics: ["Work", "Personal", "Home Project"],
            nextTaskId: 4,
        };
    });

    const [modalTask, setModalTask] = useState(null);
    const [filter, setFilter] = useState({ category: "All" });
    const [sort, setSort] = useState("none");
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [columnForNewTask, setColumnForNewTask] = useState(null);
    const [newTopic, setNewTopic] = useState("");
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [dragOverColumn, setDragOverColumn] = useState(null);

    // --- Persistence ---
    const debouncedSave = useMemo(
        () =>
            debounce((data) => {
                localStorage.setItem("kanbanBoardData", JSON.stringify(data));
            }, 500),
        []
    );

    useEffect(() => {
        debouncedSave(boardData);
    }, [boardData, debouncedSave]);

    // --- Task and Board Actions ---
    const handleDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        setDragOverColumn(null);

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        )
            return;

        const startColumn = boardData.columns[source.droppableId];
        const endColumn = boardData.columns[destination.droppableId];

        if (startColumn === endColumn) {
            const newTaskIds = Array.from(startColumn.taskIds);
            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);

            const newColumn = { ...startColumn, taskIds: newTaskIds };
            setBoardData((prevData) => ({
                ...prevData,
                columns: {
                    ...prevData.columns,
                    [newColumn.id]: newColumn,
                },
            }));
        } else {
            const startTaskIds = Array.from(startColumn.taskIds);
            startTaskIds.splice(source.index, 1);
            const newStartColumn = { ...startColumn, taskIds: startTaskIds };

            const endTaskIds = Array.from(endColumn.taskIds);
            endTaskIds.splice(destination.index, 0, draggableId);
            const newEndColumn = { ...endColumn, taskIds: endTaskIds };

            setBoardData((prevData) => ({
                ...prevData,
                columns: {
                    ...prevData.columns,
                    [newStartColumn.id]: newStartColumn,
                    [newEndColumn.id]: newEndColumn,
                },
            }));
        }
    };

    const handleOpenNewTaskModal = (columnId) => {
        setColumnForNewTask(columnId);
        setIsNewTaskModalOpen(true);
    };

    const handleCreateTask = (taskDetails) => {
        const taskId = generateUniqueId("T", boardData.nextTaskId);
        const newTask = {
            id: taskId,
            summary: taskDetails.summary,
            description: taskDetails.description,
            complexity: taskDetails.complexity,
            tags: [],
            category: taskDetails.category,
            relatedTasks: [],
            checklist: [],
            dueDate: taskDetails.dueDate,
            assignees: [],
            attachments: [],
            comments: [],
            archived: false,
        };
        const newColumn = {
            ...boardData.columns[columnForNewTask],
            taskIds: [...boardData.columns[columnForNewTask].taskIds, taskId],
        };

        setBoardData({
            ...boardData,
            tasks: { ...boardData.tasks, [taskId]: newTask },
            columns: { ...boardData.columns, [columnForNewTask]: newColumn },
            nextTaskId: boardData.nextTaskId + 1,
        });
        setIsNewTaskModalOpen(false);
        setColumnForNewTask(null);
    };

    const handleUpdateTask = (updatedTask) => {
        setBoardData((prevData) => ({
            ...prevData,
            tasks: { ...prevData.tasks, [updatedTask.id]: updatedTask },
        }));
        setModalTask(null);
    };

    const handleDeleteTask = (taskId) => {
        setBoardData((prevData) => {
            const newTasks = { ...prevData.tasks };
            delete newTasks[taskId];

            const newColumns = { ...prevData.columns };
            for (const columnId in newColumns) {
                newColumns[columnId].taskIds = newColumns[columnId].taskIds.filter(
                    (id) => id !== taskId
                );
            }

            return { ...prevData, tasks: newTasks, columns: newColumns };
        });
        setModalTask(null);
    };

    const handleArchiveTask = (taskId, isArchived) => {
        const updatedTask = { ...boardData.tasks[taskId], archived: isArchived };
        handleUpdateTask(updatedTask);
    };

    const handleAddColumn = () => {
        if (!newColumnTitle) return;
        const newColumnId = `column-${Object.keys(boardData.columns).length + 1}`;
        const newColumn = { id: newColumnId, title: newColumnTitle, taskIds: [] };
        setBoardData({
            ...boardData,
            columns: { ...boardData.columns, [newColumnId]: newColumn },
        });
        setNewColumnTitle("");
    };

    const handleRenameColumn = (columnId, newTitle) => {
        setBoardData((prevData) => ({
            ...prevData,
            columns: {
                ...prevData.columns,
                [columnId]: { ...prevData.columns[columnId], title: newTitle },
            },
        }));
    };

    const handleRemoveColumn = (columnId) => {
        const column = boardData.columns[columnId];
        if (column.taskIds.length > 0) {
            alert(
                "Cannot delete a column with tasks in it. Move all tasks out first."
            );
            return;
        }

        const { [columnId]: removedColumn, ...remainingColumns } =
            boardData.columns;
        setBoardData((prevData) => ({
            ...prevData,
            columns: remainingColumns,
        }));
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(boardData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "kanban-board-data.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                setBoardData(importedData);
                alert("Data imported successfully!");
            } catch (error) {
                alert("Error importing file. Please ensure it's a valid JSON.");
            }
        };
        reader.readAsText(file);
    };

    const handleAddTopic = () => {
        if (newTopic && !boardData.topics.includes(newTopic)) {
            setBoardData((prevData) => ({
                ...prevData,
                topics: [...prevData.topics, newTopic],
            }));
            setNewTopic("");
        }
    };

    const handleDeleteTopic = (topicToDelete) => {
        const tasksWithTopic = Object.values(boardData.tasks).some(
            (task) => task.category === topicToDelete
        );
        if (tasksWithTopic) {
            alert(
                "Cannot delete a topic that is assigned to a task. Reassign or delete tasks first."
            );
            return;
        }
        setBoardData((prevData) => ({
            ...prevData,
            topics: prevData.topics.filter((topic) => topic !== topicToDelete),
        }));
    };

    // --- Filtering and Sorting ---
    const filteredAndSortedTasks = useMemo(() => {
        const filteredTasks = Object.values(boardData.tasks).filter((task) => {
            const isCategoryMatch =
                filter.category === "All" || task.category === filter.category;
            const isArchived = task.archived;
            return isCategoryMatch && isArchived === false; // Filter out archived tasks
        });

        const sortedTasks = [...filteredTasks];
        if (sort === "complexity-asc") {
            const complexityOrder = ["low", "medium", "high"];
            sortedTasks.sort(
                (a, b) =>
                    complexityOrder.indexOf(a.complexity) -
                    complexityOrder.indexOf(b.complexity)
            );
        } else if (sort === "complexity-desc") {
            const complexityOrder = ["low", "medium", "high"];
            sortedTasks.sort(
                (a, b) =>
                    complexityOrder.indexOf(b.complexity) -
                    complexityOrder.indexOf(a.complexity)
            );
        } else if (sort === "date-asc") {
            sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        } else if (sort === "date-desc") {
            sortedTasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        }

        return sortedTasks.reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
        }, {});
    }, [boardData.tasks, filter, sort]);

    return (
        <div className={styles.kanbanApp}>
            <header className={styles.appHeader}>
                <h1>Kanban Board</h1>
                <p>A simple, locally-stored time management solution.</p>
            </header>
            <div className={styles.kanbanControls}>
                <div className={styles.controlsGroup}>
                    <label className={styles.controlLabel}>Filter:</label>
                    <select
                        className={styles.controlInput}
                        onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                        value={filter.category}
                    >
                        <option value="All">All Categories</option>
                        {boardData.topics.map((topic) => (
                            <option key={topic} value={topic}>
                                {topic}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.controlsGroup}>
                    <label className={styles.controlLabel}>Sort:</label>
                    <select
                        className={styles.controlInput}
                        onChange={(e) => setSort(e.target.value)}
                        value={sort}
                    >
                        <option value="none">None</option>
                        <option value="complexity-asc">Complexity (Low to High)</option>
                        <option value="complexity-desc">Complexity (High to Low)</option>
                        <option value="date-asc">Due Date (Asc)</option>
                        <option value="date-desc">Due Date (Desc)</option>
                    </select>
                </div>
                <div className={styles.controlsGroup}>
                    <button onClick={handleExport} className={`${styles.btn} ${styles.btnSecondary}`}>
                        Export Data
                    </button>
                    <label htmlFor="import-file" className={`${styles.btn} ${styles.btnSecondary}`}>
                        Import Data
                        <input
                            id="import-file"
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: "none" }}
                        />
                    </label>
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className={`${styles.btn} ${styles.btnSecondary}`}
                    >
                        Manage Settings
                    </button>
                </div>
            </div>
            <div className={styles.kanbanBoard}>
                {Object.values(boardData.columns).map((column) => (
                    <div
                        key={column.id}
                        className={`${styles.kanbanColumn} ${column.id === dragOverColumn ? styles.dragOver : ''}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverColumn(column.id);
                        }}
                        onDragLeave={() => setDragOverColumn(null)}
                        onDrop={(e) => {
                            e.preventDefault();
                            const taskId = e.dataTransfer.getData("text/plain");
                            const sourceColumnId = e.dataTransfer.getData("sourceColumnId");

                            // Find the index where the card should be inserted
                            const cards = Array.from(
                                e.currentTarget.querySelectorAll(`.${styles.taskCard}`)
                            );
                            const dropTarget = cards.find((card) => {
                                const rect = card.getBoundingClientRect();
                                return e.clientY < rect.top + rect.height / 2;
                            });
                            const index = dropTarget
                                ? cards.indexOf(dropTarget)
                                : column.taskIds.length;

                            // Find the source index
                            const sourceColumn = boardData.columns[sourceColumnId];
                            const sourceIndex = sourceColumn.taskIds.indexOf(taskId);

                            handleDragEnd({
                                source: { droppableId: sourceColumnId, index: sourceIndex },
                                destination: { droppableId: column.id, index },
                                draggableId: taskId,
                            });
                        }}
                    >
                        <div className={styles.columnHeader}>
                            <h3>{column.title}</h3>
                        </div>
                        <div className={styles.taskList}>
                            {column.taskIds
                                .filter((id) => !!filteredAndSortedTasks[id])
                                .map((taskId) => (
                                    <TaskCard
                                        key={taskId}
                                        task={filteredAndSortedTasks[taskId]}
                                        columnId={column.id}
                                        onOpenModal={setModalTask}
                                    />
                                ))}
                        </div>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnAddTask}`}
                            onClick={() => handleOpenNewTaskModal(column.id)}
                        >
                            + Add Task
                        </button>
                    </div>
                ))}
            </div>
            {modalTask && (
                <TaskModal
                    task={modalTask}
                    topics={boardData.topics}
                    onClose={() => setModalTask(null)}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onArchiveTask={handleArchiveTask}
                />
            )}
            {isNewTaskModalOpen && (
                <NewTaskModal
                    topics={boardData.topics}
                    onClose={() => setIsNewTaskModalOpen(false)}
                    onCreateTask={handleCreateTask}
                />
            )}
            {isSettingsModalOpen && (
                <SettingsModal
                    columns={boardData.columns}
                    topics={boardData.topics}
                    newColumnTitle={newColumnTitle}
                    newTopic={newTopic}
                    onAddColumn={handleAddColumn}
                    onRenameColumn={handleRenameColumn}
                    onRemoveColumn={handleRemoveColumn}
                    onNewColumnTitleChange={setNewColumnTitle}
                    onAddTopic={handleAddTopic}
                    onDeleteTopic={handleDeleteTopic}
                    onNewTopicChange={setNewTopic}
                    onClose={() => setIsSettingsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
