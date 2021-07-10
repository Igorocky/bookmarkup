"use strict";

const COLLAPSED_SIGN = String.fromCharCode(8901)
const EXPANDED_SIGN = String.fromCharCode(8728)

function TreeView({tree, collapsedNodeRenderer, expandedNodeRenderer, showBullet}) {

    //state props
    const s = {
        EXPANDED_NODE_IDS: 'EXPANDED_NODE_IDS',
    }

    const [state, setState] = useState(() => createState({}))

    function createState({prev, params}) {
        const getParam = createParamsGetter({prev, params})

        return createObj({
            [s.EXPANDED_NODE_IDS]: getParam(s.EXPANDED_NODE_IDS,[]),
        })
    }

    function expandCollapse(idToChange) {
        if (isExpanded(idToChange)) {
            setState(prev=>prev.set(s.EXPANDED_NODE_IDS,prev[s.EXPANDED_NODE_IDS].filter(id => id != idToChange)))
        } else {
            setState(prev=>prev.set(s.EXPANDED_NODE_IDS,[idToChange, ...prev[s.EXPANDED_NODE_IDS]]))
        }
    }

    function isExpanded(id) {
        return state[s.EXPANDED_NODE_IDS].includes(id)
    }

    function renderNode({node}) {
        const expanded = isExpanded(node.id)
        return RE.table({style:{borderCollapse: 'collapse'}},
            RE.tbody({},
                RE.tr({key:node.id, className:'tree-node', onClick: () => expandCollapse(node.id)},
                    RE.td({style: {width:'8px'}},
                        showBullet(node)?(expanded?EXPANDED_SIGN:COLLAPSED_SIGN):'',
                    ),
                    RE.td({},
                        expandedNodeRenderer(node),
                    )
                ),
                expanded?(node.children??[]).map(child =>
                    RE.tr({key:child.id},
                        RE.td({},
                            '',
                        ),
                        RE.td({},
                            renderNode({node:child}),
                        )
                    )
                ):null
            )
        )
    }

    return renderNode({node:tree})
}
