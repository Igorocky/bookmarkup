"use strict";

//curIdx + pageNumShift = currPageNum
function Pagination({pageNumShift,numOfPages,curIdx,onChange}) {
    return RE.Container.row.left.center({},{style: {marginRight:'15px'}},
        RE.TextField(
            {
                variant: 'outlined', label: 'Page',
                style: {width: 80},
                size: 'small',
                onKeyDown: ({nativeEvent:event}) => {
                    if (event.keyCode == 13) {
                        const newPageNumStr = event.target.value?.trim()
                        if (newPageNumStr.length) {
                            const newIdx = Math.max(0, Math.min(numOfPages-1, parseInt(newPageNumStr)-pageNumShift))
                            if (newIdx != curIdx) {
                                onChange(newIdx)
                                event.target.value = ''
                            }
                        }
                    }
                },
            }
        ),
        RE.ButtonGroup({variant:'contained', size:'small'},
            RE.Button({onClick: () => onChange(0), disabled: curIdx === 0},
                '<<'
            ),
            RE.Button({onClick: () => onChange(curIdx-1), disabled: curIdx === 0},
                '<'
            ),
            RE.Button({onClick: () => onChange(curIdx+1), disabled: curIdx === numOfPages-1},
                '>'
            ),
            RE.Button({onClick: () => onChange(numOfPages-1), disabled: curIdx == numOfPages-1},
                '>>'
            ),
            ints(Math.max(0,curIdx-3),Math.min(numOfPages-1,curIdx+3)).map(idx => RE.Button(
                {
                    key:`page-btn-${idx}`,
                    onClick: () => idx===curIdx?null:onChange(idx)
                },
                idx===curIdx?(`[${idx+pageNumShift}]`):(idx+pageNumShift)
            )),
            (curIdx+3 < numOfPages-1)?[
                RE.Button({key:`...-btn`,disabled: true},
                    '...'
                ),
                RE.Button({key:`last-page-btn`, onClick: () => onChange(numOfPages-1)},
                    numOfPages-1+pageNumShift
                )
            ]:null,
        )
    )
}
