'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function SelectorHelperPage() {
  const router = useRouter()

  const bookmarkletCode = `javascript:(function(){
    document.body.style.cursor='crosshair';
    var overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,123,255,0.1);z-index:999999;pointer-events:none';
    document.body.appendChild(overlay);

    var handler=function(e){
      e.preventDefault();
      e.stopPropagation();

      var el=e.target;
      var selector='';

      if(el.id){
        selector='#'+el.id;
      }else if(el.className){
        var classes=el.className.split(' ').filter(c=>c).join('.');
        selector=el.tagName.toLowerCase()+'.'+classes;
      }else{
        selector=el.tagName.toLowerCase();
      }

      navigator.clipboard.writeText(selector).then(function(){
        alert('Selector 복사 완료!\\n\\n'+selector+'\\n\\nDCS 페이지로 돌아가서 붙여넣으세요.');
        document.body.style.cursor='';
        overlay.remove();
        document.removeEventListener('click',handler,true);
      });
    };

    alert('원하는 요소를 클릭하세요!');
    document.addEventListener('click',handler,true);
  })();`

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bookmarkletCode)
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← 뒤로가기
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Selector 쉽게 찾기</CardTitle>
            <CardDescription>
              북마클릿을 사용하면 클릭만으로 Selector를 찾을 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 북마클릿 버튼 */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">1단계: 북마클릿 설치</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  아래 버튼을 북마크바로 드래그하세요
                </p>
                <div className="rounded-lg border-2 border-dashed bg-muted p-6 text-center">
                  <a
                    href={bookmarkletCode}
                    draggable
                    onDragStart={handleDragStart}
                    className="inline-flex h-12 items-center rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
                    style={{ cursor: 'move' }}
                  >
                    📌 DCS Selector 찾기
                  </a>
                  <p className="mt-3 text-xs text-muted-foreground">
                    ↑ 이 버튼을 북마크바로 드래그하세요
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">2단계: 사용 방법</h3>
                <ol className="ml-4 list-decimal space-y-2 text-sm">
                  <li>크롤링할 웹사이트로 이동</li>
                  <li>북마크바의 "DCS Selector 찾기" 클릭</li>
                  <li>수집하려는 데이터 요소를 클릭</li>
                  <li>Selector가 자동으로 복사됩니다</li>
                  <li>DCS로 돌아와서 붙여넣기 (Ctrl+V 또는 Cmd+V)</li>
                </ol>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                <p className="text-sm">
                  💡 <strong>팁:</strong> 리스트나 테이블의 첫 번째 항목을
                  클릭하세요. 예를 들어, 기관명 목록이라면 첫 번째 기관명을
                  클릭하면 됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chrome DevTools 방법 */}
        <Card>
          <CardHeader>
            <CardTitle>Chrome DevTools 사용하기 (고급)</CardTitle>
            <CardDescription>더 정확한 Selector가 필요한 경우</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">방법 1: Copy Selector</h4>
                <ol className="ml-4 list-decimal space-y-1 text-sm">
                  <li>웹페이지에서 F12 또는 우클릭 → 검사</li>
                  <li>Elements 탭에서 원하는 요소 찾기</li>
                  <li>요소에서 우클릭 → Copy → Copy selector</li>
                  <li>DCS에 붙여넣기</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">방법 2: 요소 선택 도구</h4>
                <ol className="ml-4 list-decimal space-y-1 text-sm">
                  <li>DevTools 왼쪽 상단의 화살표 아이콘 클릭</li>
                  <li>페이지에서 원하는 요소 클릭</li>
                  <li>Elements 탭에서 해당 요소가 선택됨</li>
                  <li>우클릭 → Copy → Copy selector</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 예제 */}
        <Card>
          <CardHeader>
            <CardTitle>일반적인 Selector 패턴</CardTitle>
            <CardDescription>자주 사용되는 Selector 예제</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="rounded border p-3">
                <code className="text-primary">.item-title</code>
                <p className="mt-1 text-muted-foreground">
                  → class가 "item-title"인 모든 요소
                </p>
              </div>
              <div className="rounded border p-3">
                <code className="text-primary">table tr td:nth-child(2)</code>
                <p className="mt-1 text-muted-foreground">
                  → 테이블의 두 번째 열
                </p>
              </div>
              <div className="rounded border p-3">
                <code className="text-primary">.list-item h3</code>
                <p className="mt-1 text-muted-foreground">
                  → list-item 안의 h3 제목들
                </p>
              </div>
              <div className="rounded border p-3">
                <code className="text-primary">div.card .name</code>
                <p className="mt-1 text-muted-foreground">
                  → card 클래스 div 안의 name 클래스 요소
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
