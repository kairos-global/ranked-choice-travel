import { useState, useEffect } from "react";

interface DragDropItem {
  id: string;
  text: string;
  rank: number;
}

interface DragDropListProps {
  items: DragDropItem[];
  onChange: (items: DragDropItem[]) => void;
}

export default function DragDropList({ items, onChange }: DragDropListProps) {
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const [orderedItems, setOrderedItems] = useState<DragDropItem[]>(items);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const handleDragStart = (e: React.DragEvent, item: DragDropItem) => {
    setDraggedItem(item);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedItem(null);
    
    // Update ranks based on new order
    const updatedItems = orderedItems.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    setOrderedItems(updatedItems);
    onChange(updatedItems);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: DragDropItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const newItems = [...orderedItems];
    const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = newItems.findIndex(item => item.id === targetItem.id);

    // Remove dragged item
    newItems.splice(draggedIndex, 1);
    // Insert at new position
    newItems.splice(targetIndex, 0, draggedItem);

    setOrderedItems(newItems);
  };

  const resetOrder = () => {
    const resetItems = [...items].sort((a, b) => a.rank - b.rank);
    setOrderedItems(resetItems);
    onChange(resetItems);
  };

  return (
    <div>
      <div style={{ fontSize: '10px', marginBottom: '8px', color: 'black' }}>
        Drag destinations to rank them from most preferred (1) to least preferred ({items.length}).
      </div>
      
      <div>
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            className="retro-drag-item"
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item)}
          >
            <span className="retro-rank-number">{index + 1}</span>
            {item.text}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button className="retro-button" onClick={resetOrder}>
          Reset Ranking
        </button>
      </div>
    </div>
  );
}
