import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
  useReactFlow,
} from '@xyflow/react';
import { useStore } from '../../store/useStore';
import PersonNode, { type PersonNodeData } from './PersonNode';
import LinkEdge, { type LinkEdgeData } from './LinkEdge';
import type { Link, Person } from '../../types';

// Generate automatic stream connections between people with same stream
function generateStreamLinks(people: Person[]): Link[] {
  const streamGroups: Record<string, Person[]> = {};

  // Group people by stream
  people.forEach((person) => {
    if (person.stream) {
      const streamKey = person.stream.toLowerCase().trim();
      if (!streamGroups[streamKey]) {
        streamGroups[streamKey] = [];
      }
      streamGroups[streamKey].push(person);
    }
  });

  // Create links between all people in same stream
  const streamLinks: Link[] = [];
  Object.entries(streamGroups).forEach(([streamName, members]) => {
    // Create links between each pair (avoid duplicates)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        streamLinks.push({
          id: `stream-${members[i].id}-${members[j].id}`,
          sourceId: members[i].id,
          targetId: members[j].id,
          description: streamName.charAt(0).toUpperCase() + streamName.slice(1),
          type: 'stream',
          createdAt: '',
          updatedAt: '',
        });
      }
    }
  });

  return streamLinks;
}

// Generate automatic interest connections between people with shared interests
function generateInterestLinks(people: Person[]): Link[] {
  const interestLinks: Link[] = [];
  const seenPairs = new Set<string>();

  // Compare each pair of people
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const person1 = people[i];
      const person2 = people[j];

      // Skip if either person has no interests
      if (!person1.interests?.length || !person2.interests?.length) continue;

      // Find shared interests
      const sharedInterests = person1.interests.filter((interest) =>
        person2.interests!.includes(interest)
      );

      // Create a link for each shared interest
      sharedInterests.forEach((interest) => {
        const pairKey = [person1.id, person2.id, interest].sort().join('-');
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          interestLinks.push({
            id: `interest-${person1.id}-${person2.id}-${interest}`,
            sourceId: person1.id,
            targetId: person2.id,
            description: interest,
            type: 'interest',
            createdAt: '',
            updatedAt: '',
          });
        }
      });
    }
  }

  return interestLinks;
}

const nodeTypes = {
  person: PersonNode,
};

const edgeTypes = {
  link: LinkEdge,
};

function Canvas() {
  const {
    people,
    links,
    viewport,
    selectedPersonId,
    selectedLinkId,
    updatePerson,
    selectPerson,
    selectLink,
    clearSelection,
    setViewport,
    openAddLinkModal,
    openAddPersonModal,
    darkMode,
  } = useStore();

  const { setViewport: setFlowViewport, screenToFlowPosition } = useReactFlow();

  // Convert people to nodes
  const initialNodes: Node[] = useMemo(() => {
    return people.map((person) => ({
      id: person.id,
      type: 'person',
      position: person.position,
      data: {
        name: person.name,
        affiliations: person.affiliations,
        photoUrl: person.photoUrl,
        isSelected: person.id === selectedPersonId,
      } satisfies PersonNodeData,
    }));
  }, [people, selectedPersonId]);

  // Generate stream-based automatic links
  const streamLinks = useMemo(() => generateStreamLinks(people), [people]);

  // Generate interest-based automatic links
  const interestLinks = useMemo(() => generateInterestLinks(people), [people]);

  // Combine manual links, stream links, and interest links
  const allLinks = useMemo(() => [...links, ...streamLinks, ...interestLinks], [links, streamLinks, interestLinks]);

  // Calculate parallel edges between same nodes
  const getParallelEdgeInfo = useCallback((allLinks: Link[]) => {
    const pairCounts: Record<string, number> = {};
    const pairIndices: Record<string, number> = {};

    allLinks.forEach((link) => {
      const key = [link.sourceId, link.targetId].sort().join('-');
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    });

    return allLinks.map((link) => {
      const key = [link.sourceId, link.targetId].sort().join('-');
      const total = pairCounts[key];
      const index = pairIndices[key] || 0;
      pairIndices[key] = index + 1;
      return { link, parallelIndex: index, parallelTotal: total };
    });
  }, []);

  // Convert links to edges
  const initialEdges: Edge[] = useMemo(() => {
    const parallelInfo = getParallelEdgeInfo(allLinks);

    return parallelInfo.map(({ link, parallelIndex, parallelTotal }) => ({
      id: link.id,
      source: link.sourceId,
      target: link.targetId,
      type: 'link',
      data: {
        description: link.description,
        type: link.type,
        isSelected: link.id === selectedLinkId,
        parallelIndex,
        parallelTotal,
        isStreamLink: link.type === 'stream',
        isInterestLink: link.type === 'interest',
      } satisfies LinkEdgeData,
    }));
  }, [allLinks, selectedLinkId, getParallelEdgeInfo]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes with people data
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Sync edges with links data
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Set initial viewport
  useEffect(() => {
    if (viewport) {
      setFlowViewport(viewport);
    }
  }, []);

  // Handle node position changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Update position in store when node is dragged
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          updatePerson(change.id, { position: change.position });
        }
      });
    },
    [onNodesChange, updatePerson]
  );

  // Handle edge changes (selection, removal)
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Handle new connection (open add link modal)
  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target && connection.source !== connection.target) {
        // Set source and open modal to complete link creation
        openAddLinkModal(connection.source);
        // Store target temporarily
        useStore.setState({
          pendingLinkSourceId: connection.source,
        });
        // Open modal with both source and target
        useStore.setState((state) => ({
          ...state,
          _pendingLinkTargetId: connection.target,
        }));
      }
    },
    [openAddLinkModal]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectPerson(node.id);
    },
    [selectPerson]
  );

  // Handle edge click
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      selectLink(edge.id);
    },
    [selectLink]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Handle double-click on pane to add person
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      // Store the position for the new person
      useStore.setState((state) => ({
        ...state,
        _newPersonPosition: position,
      }));
      openAddPersonModal();
    },
    [screenToFlowPosition, openAddPersonModal]
  );

  // Handle viewport change
  const onMoveEnd = useCallback(
    (_: unknown, vp: { x: number; y: number; zoom: number }) => {
      setViewport(vp);
    },
    [setViewport]
  );

  return (
    <div className={`w-full h-full ${darkMode ? 'dark-flow' : ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDoubleClick={onPaneDoubleClick}
        onMoveEnd={onMoveEnd}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'link',
        }}
        connectionLineStyle={{ stroke: darkMode ? '#64748b' : '#94a3b8', strokeWidth: 2 }}
        snapToGrid
        snapGrid={[15, 15]}
        style={{ backgroundColor: darkMode ? '#1e293b' : undefined }}
      >
        <Background color={darkMode ? '#334155' : '#e2e8f0'} gap={20} />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const data = node.data as PersonNodeData;
            return data.isSelected ? '#3b82f6' : darkMode ? '#64748b' : '#94a3b8';
          }}
          maskColor={darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
          style={{ backgroundColor: darkMode ? '#1e293b' : undefined }}
        />
      </ReactFlow>
    </div>
  );
}

export default Canvas;
