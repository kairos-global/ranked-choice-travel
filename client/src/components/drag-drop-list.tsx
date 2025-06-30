import { useState, useEffect, useRef } from "react";

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
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchItem, setTouchItem] = useState<DragDropItem | null>(null);

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

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent, item: DragDropItem) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchItem(item);
    e.currentTarget.classList.add('dragging');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchItem) return;
    e.preventDefault();
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    
    // Find the item under the touch point
    const elementFromPoint = document.elementFromPoint(e.touches[0].clientX, touchY);
    const targetElement = elementFromPoint?.closest('.retro-drag-item');
    
    if (targetElement) {
      const targetId = targetElement.getAttribute('data-item-id');
      const targetItem = orderedItems.find(item => item.id === targetId);
      
      if (targetItem && targetItem.id !== touchItem.id) {
        // Reorder items
        const newItems = [...orderedItems];
        const touchIndex = newItems.findIndex(item => item.id === touchItem.id);
        const targetIndex = newItems.findIndex(item => item.id === targetItem.id);

        // Remove touched item
        newItems.splice(touchIndex, 1);
        // Insert at new position
        newItems.splice(targetIndex, 0, touchItem);

        setOrderedItems(newItems);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.currentTarget.classList.remove('dragging');
    setTouchItem(null);
    setTouchStartY(0);
    
    // Update ranks based on new order
    const updatedItems = orderedItems.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    setOrderedItems(updatedItems);
    onChange(updatedItems);
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
            data-item-id={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item)}
            onTouchStart={(e) => handleTouchStart(e, item)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
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
