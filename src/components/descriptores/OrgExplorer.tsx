'use client'

// ════════════════════════════════════════════════════════════════════════════
// ORG EXPLORER — Opción C: Expand on click + fitView automático
// Arranca con gerencias colapsadas. Clic expande/colapsa cargos.
// dagre re-layout + fitView animado post-toggle.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useRef } from 'react'
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EmpresaNode from './nodes/EmpresaNode'
import GerenciaNode from './nodes/GerenciaNode'
import CargoNode from './nodes/CargoNode'
import RoleCardBento from './RoleCardBento'

// ── Types ──

interface OrgDepartment {
  id: string
  displayName: string
  parentId: string | null
  standardCategory: string | null
  level: number
}

interface OrgPosition {
  jobTitle: string
  departmentId: string
  departmentName: string
  employeeCount: number
  descriptorStatus: 'CONFIRMED' | 'DRAFT' | 'NONE'
  descriptorId: string | null
  socCode: string | null
  employees: Array<{ id: string; fullName: string }>
}

interface OrgTreeData {
  companyName: string
  departments: OrgDepartment[]
  positions: OrgPosition[]
}

// ── Node types (registered once) ──

const nodeTypes = {
  empresa: EmpresaNode,
  gerencia: GerenciaNode,
  cargo: CargoNode,
}

// ── Edge styles ──

const EDGE_BASE = { stroke: 'rgba(167,139,250,0.15)', strokeWidth: 1.5 }
const EDGE_CONFIRMED = { stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1.5 }

// ── Dagre layout ──

function layoutGraph(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100, marginx: 60, marginy: 60 })

  for (const node of nodes) {
    const w = node.type === 'empresa' ? 240 : node.type === 'gerencia' ? 200 : 180
    const h = node.type === 'empresa' ? 60 : node.type === 'gerencia' ? 90 : 50
    g.setNode(node.id, { width: w, height: h })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  const laid = nodes.map(node => {
    const pos = g.node(node.id)
    return { ...node, position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 } }
  })

  return { nodes: laid, edges }
}

// ── Build graph with expand state ──

function buildGraph(
  data: OrgTreeData,
  expandedDepts: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const rootId = 'empresa-root'
  nodes.push({
    id: rootId,
    type: 'empresa',
    position: { x: 0, y: 0 },
    data: { companyName: data.companyName },
  })

  // Group positions by department
  const deptPositions = new Map<string, OrgPosition[]>()
  for (const pos of data.positions) {
    if (!deptPositions.has(pos.departmentId)) deptPositions.set(pos.departmentId, [])
    deptPositions.get(pos.departmentId)!.push(pos)
  }

  // Department nodes
  for (const dept of data.departments) {
    const positions = deptPositions.get(dept.id) ?? []
    const headcount = positions.reduce((sum, p) => sum + p.employeeCount, 0)
    const confirmed = positions.filter(p => p.descriptorStatus === 'CONFIRMED').length
    const confirmedPercent = positions.length > 0 ? Math.round((confirmed / positions.length) * 100) : 0
    const isExpanded = expandedDepts.has(dept.id)

    nodes.push({
      id: `dept-${dept.id}`,
      type: 'gerencia',
      position: { x: 0, y: 0 },
      data: {
        displayName: dept.displayName,
        headcount,
        positionCount: positions.length,
        confirmedPercent,
        expanded: isExpanded,
      },
    })

    // Edge to parent
    const parentNodeId = dept.parentId ? `dept-${dept.parentId}` : rootId
    const parentExists = dept.parentId
      ? data.departments.some(d => d.id === dept.parentId)
      : true

    if (parentExists) {
      edges.push({
        id: `e-${parentNodeId}-dept-${dept.id}`,
        source: parentNodeId,
        target: `dept-${dept.id}`,
        type: 'default',
        style: EDGE_BASE,
      })
    }

    // Cargo nodes — ONLY if expanded
    if (isExpanded) {
      for (const pos of positions) {
        const nodeId = `cargo-${dept.id}-${pos.jobTitle}`
        nodes.push({
          id: nodeId,
          type: 'cargo',
          position: { x: 0, y: 0 },
          data: {
            jobTitle: pos.jobTitle,
            employeeCount: pos.employeeCount,
            descriptorStatus: pos.descriptorStatus,
          },
        })

        const isCargoConfirmed = pos.descriptorStatus === 'CONFIRMED'
        edges.push({
          id: `e-dept-${dept.id}-${nodeId}`,
          source: `dept-${dept.id}`,
          target: nodeId,
          type: 'default',
          animated: isCargoConfirmed,
          style: isCargoConfirmed ? EDGE_CONFIRMED : EDGE_BASE,
        })
      }
    }
  }

  return layoutGraph(nodes, edges)
}

// ── Inner component (needs ReactFlowProvider context) ──

function OrgExplorerInner({ data }: { data: OrgTreeData }) {
  const router = useRouter()
  const reactFlowInstance = useReactFlow()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCargo, setSelectedCargo] = useState<OrgPosition | null>(null)
  // Auto-expand departments that have confirmed descriptors
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    const deptPositions = new Map<string, OrgPosition[]>()
    for (const pos of data.positions) {
      if (!deptPositions.has(pos.departmentId)) deptPositions.set(pos.departmentId, [])
      deptPositions.get(pos.departmentId)!.push(pos)
    }
    for (const [deptId, positions] of deptPositions) {
      if (positions.some(p => p.descriptorStatus === 'CONFIRMED')) {
        initial.add(deptId)
      }
    }
    return initial
  })

  // Build graph based on expand state
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => buildGraph(data, expandedDepts),
    [data, expandedDepts]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Sync when expandedDepts changes → re-layout + fitView
  const prevExpandRef = useRef(expandedDepts)
  if (prevExpandRef.current !== expandedDepts) {
    prevExpandRef.current = expandedDepts
    // Schedule state update + fitView after render
    setTimeout(() => {
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.15, duration: 400 })
      }, 50)
    }, 0)
  }

  // Handle node click
  const onNodeClick = useCallback((_: any, node: Node) => {
    // Gerencia: toggle expand/collapse
    if (node.type === 'gerencia') {
      const deptId = node.id.replace('dept-', '')
      setExpandedDepts(prev => {
        const next = new Set(prev)
        if (next.has(deptId)) next.delete(deptId)
        else next.add(deptId)
        return next
      })
      return
    }

    // Cargo: open side-sheet or navigate
    if (node.type === 'cargo') {
      const pos = data.positions.find(
        p => `cargo-${p.departmentId}-${p.jobTitle}` === node.id
      )
      if (pos) {
        if (pos.descriptorStatus === 'CONFIRMED') {
          setSelectedCargo(pos)
        } else {
          router.push(`/dashboard/descriptores/${encodeURIComponent(pos.jobTitle)}`)
        }
      }
    }
  }, [data.positions, router])

  // Search: dim non-matching nodes
  const displayNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes
    const q = searchQuery.toLowerCase()
    return nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity:
          n.data?.jobTitle?.toLowerCase().includes(q)
          || n.data?.displayName?.toLowerCase().includes(q)
          || n.data?.companyName?.toLowerCase().includes(q)
          ? 1 : 0.2,
        transition: 'opacity 0.3s',
      },
    }))
  }, [nodes, searchQuery])

  // MiniMap color
  const miniMapColor = useCallback((node: Node) => {
    if (node.type === 'empresa') return '#22D3EE'
    if (node.type === 'gerencia') return '#475569'
    if (node.data?.descriptorStatus === 'CONFIRMED') return '#10B981'
    return '#F59E0B'
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Search bar */}
      <div className="absolute top-4 left-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar cargo..."
            className="w-56 pl-9 pr-8 py-2 text-xs text-slate-300 font-light bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl placeholder:text-slate-600 focus:border-cyan-500/30 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/30 rounded-xl px-4 py-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] text-slate-500">Confirmado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[9px] text-slate-500">Pendiente</span>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        className="bg-[#0F172A]"
      >
        <Controls
          position="bottom-left"
          className="!bg-slate-900/80 !border-slate-700/50 !rounded-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700/50 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-700"
        />
        <MiniMap
          position="bottom-right"
          nodeColor={miniMapColor}
          maskColor="rgba(15,23,42,0.8)"
          className="!bg-slate-900/60 !border-slate-700/30 !rounded-xl"
        />
        <Background color="#1e293b" gap={20} size={1} />
      </ReactFlow>

      {/* RoleCardBento side-sheet */}
      <RoleCardBento
        position={selectedCargo}
        onClose={() => setSelectedCargo(null)}
      />
    </div>
  )
}

// ── Wrapper with ReactFlowProvider ──

interface OrgExplorerProps {
  data: OrgTreeData
}

export default function OrgExplorer({ data }: OrgExplorerProps) {
  return (
    <ReactFlowProvider>
      <OrgExplorerInner data={data} />
    </ReactFlowProvider>
  )
}
