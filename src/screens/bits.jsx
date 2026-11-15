import { Button } from '../components/ui/Button.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { MathBlock } from '../components/ui/MathBlock.jsx'
import { StatLine } from '../components/ui/StatLine.jsx'
import { sourceOrg, useGame } from '../engine/useGame.jsx'
import { usePlay } from './playContext.jsx'
import shell from './shell.module.css'


/** Drop a trailing "↗" (and the spaces before it); the button adds its own. */
function stripArrow(text) {
  return text.endsWith('↗') ? text.slice(0, -1).trimEnd() : text
}
export function kgText(model, value) {
  return `${model.fmt(value)} kg`
}

export function usdText(model, value) {
  return `$${model.fmt(value)}M`
}

export function SourceButton({ sourceKey, label }) {
  const { data } = useGame()
  const { openSource } = usePlay()
  if (!sourceKey || sourceKey === 'game') {
    return <Button variant="ghost" onClick={() => openSource('game')}>Game value</Button>
  }
  const text = stripArrow(label || `${sourceOrg(data, sourceKey)} source`)
  return <Button variant="ghost" onClick={() => openSource(sourceKey)}>{text} ↗</Button>
}

export function FactLine({ factKey }) {
  const { data } = useGame()
  const fact = data.FACTS[factKey]
  if (!fact) return null
  return (
    <p className={shell.note}>
      <b>Did you know?</b> {fact.text} <SourceButton sourceKey={fact.src} />
    </p>
  )
}

const EQUIPMENT = [
  { key: 'item', label: 'Item' },
  { key: 'kg', label: 'kg' },
  { key: 'w', label: 'W' },
  { key: 'cost', label: '$M' },
]

export function equipmentRows(report, model) {
  const rows = report.lines.map((line, index) => ({
    key: `${line.label}-${index}`,
    item: line.label,
    kg: model.fmt(line.mass),
    w: line.gen ? `+${model.fmt(line.gen)}` : (line.power ? model.fmt(line.power) : ''),
    cost: line.cost ? model.fmt(line.cost) : '',
  }))
  if (report.rocket) {
    rows.push({
      key: 'rocket',
      item: `Rocket: ${report.rocket.title}`,
      kg: '',
      w: '',
      cost: model.fmt(report.rocket.cost),
    })
  }
  return rows
}

export function EquipmentList({ report }) {
  const { model } = useGame()
  return (
    <>
      <DataTable
        columns={EQUIPMENT}
        rows={equipmentRows(report, model)}
        foot={{
          item: 'Total (dry)',
          kg: model.fmt(report.dry),
          w: model.fmt(report.powerNeed),
          cost: model.fmt(report.totalCost),
        }}
      />
      <p className={shell.note}>MEL = Master Equipment List, the same table NASA's Mission Design Lab builds. Hardware masses and costs are game values scaled from real missions.</p>
      <SourceButton sourceKey="mdl" />
    </>
  )
}

const BURNS = [
  { key: 'name', label: 'Burn (in flight order)' },
  { key: 'dv', label: 'Δv m/s' },
  { key: 'ratio', label: 'm₀/m_f' },
  { key: 'prop', label: 'Fuel kg' },
  { key: 'tanks', label: 'Tanks kg' },
  { key: 'start', label: 'Mass before kg' },
]

export function SpacecraftSummary({ report }) {
  const { state, model, toggleMath } = useGame()
  const open = Boolean(state.showMath.rocket)
  const fuel = report.dry > 0 ? model.fmt((report.propellant / report.dry) * 100) : '0'
  return (
    <GlassPanel title="Your spacecraft">
      <StatLine items={[
        { label: 'Hardware (dry)', value: kgText(model, report.dry) },
        { label: 'Fuel + tanks', value: kgText(model, report.propellant) },
        { label: 'Launch mass', value: kgText(model, report.tli), tone: 'accent' },
      ]} />
      <p className={shell.note}>Fuel is <b>{fuel}%</b> of your hardware mass. That's the rocket equation at work.</p>
      <Button variant="ghost" aria-expanded={open} onClick={() => toggleMath('rocket')}>
        {open ? '▾ Hide the math' : '▸ Show the math: why so much fuel?'}
      </Button>
      {open ? <RocketMath state={state} /> : null}
    </GlassPanel>
  )
}

export function RocketMath({ state }) {
  const { data, model } = useGame()
  const math = model.rocketMath(state)
  if (!math) return null
  const formula = {
    title: 'Tsiolkovsky rocket equation (vₑ = exhaust speed, m₀ = mass before, m_f = mass after)',
    steps: [
      { eq: 'Δv = vₑ · ln(m₀ / m_f)', num: 'Each burn needs a mass ratio m₀/m_f = e^(Δv / vₑ)' },
      { eq: 'vₑ = Isp · g₀', num: `Isp ${math.isp} s (engine efficiency) × ${data.ENGINE.g0} m/s² = ${model.fmt(math.ve)} m/s` },
    ],
  }
  const rows = math.burns.map((burn) => ({
    key: burn.name,
    name: burn.name,
    dv: model.fmt(burn.dv),
    ratio: burn.ratio.toFixed(2),
    prop: model.fmt(burn.prop),
    tanks: model.fmt(burn.tanks),
    start: model.fmt(burn.mStart),
  }))
  return (
    <>
      <p className={shell.note}>In plain words: fuel is heavy, and you need even more fuel to lift that fuel. That's why rockets are huge.</p>
      <MathBlock math={formula}>
        <SourceButton sourceKey="spsIsp" label="Apollo engine" />
      </MathBlock>
      <DataTable columns={BURNS} rows={rows} />
      <p className={shell.note}>
        Δv values from NASA lunar studies. Mass before = mass after + fuel + tanks. Tanks weigh {Math.round(data.ENGINE.tankFraction * 100)}% of their fuel (game value). Trans-lunar injection ({model.fmt(data.DV.tli.value)} m/s) is done by the rocket's upper stage, so it is not in this table.
      </p>
      <div className={shell.actions}>
        <SourceButton sourceKey="altair" />
        <SourceButton sourceKey="cev" />
      </div>
    </>
  )
}
