"use strict";

function Pagination({numOfPages,curPage,onChange}) {

    return RE.Container.row.left.center({},{style: {marginRight:'15px'}},
        RE.TextField(
            {
                variant: 'outlined', label: 'Page',
                style: {width: 80},
                size: 'small',
                onKeyDown: ({nativeEvent:event}) => {
                    if (event.keyCode == 13) {
                        const newPageStr = event.target.value?.replaceAll(/\D/g,'')
                        if (newPageStr.length) {
                            const newPage = Math.max(1, Math.min(numOfPages, parseInt(newPageStr)))
                            if (newPage != curPage) {
                                onChange(newPage)
                                event.target.value = ''
                            }
                        }
                    }
                },
            }
        ),
        RE.ButtonGroup({variant:'contained', size:'small'},
            RE.Button({onClick: () => onChange(1), disabled: curPage == 1},
                '<<'
            ),
            RE.Button({onClick: () => onChange(curPage-1), disabled: curPage == 1},
                '<'
            ),
            RE.Button({onClick: () => onChange(curPage+1), disabled: curPage == numOfPages},
                '>'
            ),
            RE.Button({onClick: () => onChange(numOfPages), disabled: curPage == numOfPages},
                '>>'
            ),
            ints(Math.max(1,curPage-3),Math.min(numOfPages,curPage+3)).map(p => RE.Button(
                {
                    key:`page-btn-${p}`,
                    onClick: () => p==curPage?null:onChange(p)
                },
                p==curPage?(`[${p}]`):p
            )),
            (curPage+3 < numOfPages)?[
                RE.Button({key:`...-btn`,disabled: true},
                    '...'
                ),
                RE.Button({key:`last-page-btn`, onClick: () => onChange(numOfPages)},
                    numOfPages
                )
            ]:null,
        )
    )
}
