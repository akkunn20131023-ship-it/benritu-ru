import { LegalLayout, LegalSection } from "./LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="プライバシーポリシー" updated="2026年7月18日">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Mytnela Flow（以下「本サービス」）は、利用者のプライバシーを尊重します。本サービスはアカウント登録・ログイン・メールアドレス・電話番号を必要とせず、個人を特定する情報を原則として収集しません。
      </p>

      <LegalSection heading="1. 収集する情報">
        <p>本サービスは、氏名・メールアドレス・電話番号などの個人情報を収集しません。作成したデータ（ToDo・メモ・家計簿など）や設定は、利用者の端末（ブラウザ）内にのみ保存され、運営者のサーバーへ送信されません。</p>
      </LegalSection>

      <LegalSection heading="2. Cookie・ローカルストレージ">
        <p>本サービスは、データや設定の保存のためにブラウザのローカルストレージを使用します。これは利用者の端末内で完結し、行動追跡や広告目的では使用しません。</p>
      </LegalSection>

      <LegalSection heading="3. アクセス解析・広告">
        <p>現時点では、第三者による行動追跡型のアクセス解析ツールや広告は使用していません。将来導入する場合は、本ポリシーを更新し、必要に応じて同意取得の仕組みを設けます。</p>
      </LegalSection>

      <LegalSection heading="4. オンライン機能（共同作業）のデータ">
        <p>ルームコード等で参加するオンライン機能では、参加者間でメッセージ等をやり取りするために、通信を中継するサーバーを経由します。これらのデータはリアルタイムの中継のために一時的に扱われるもので、内容を恒久的に保存することを目的としていません。ルームには匿名の識別子のみが用いられ、個人を特定する情報は要求されません。</p>
      </LegalSection>

      <LegalSection heading="5. 外部サービス（AI機能）">
        <p>利用者がAI機能で外部のAIプロバイダーを設定した場合、その機能の利用時に入力内容が当該プロバイダーへ送信されます。送信先の取り扱いは各プロバイダーのポリシーに従います。設定しない限り送信は行われません。</p>
      </LegalSection>

      <LegalSection heading="6. データの管理と削除">
        <p>データは利用者自身が管理します。ブラウザのデータを消去すると、本サービスに保存された内容も削除されます。設定画面のエクスポート／インポート機能でバックアップ・復元が可能です。</p>
      </LegalSection>

      <LegalSection heading="7. セキュリティ">
        <p>運営者は、本サービスの安全な提供に努めます。ただし、インターネットを通じた通信・保存の安全性を完全に保証することはできません。</p>
      </LegalSection>

      <LegalSection heading="8. ポリシーの変更">
        <p>本ポリシーは、必要に応じて変更されることがあります。変更後の内容は本ページに掲載した時点で効力を生じます。</p>
      </LegalSection>

      <LegalSection heading="9. お問い合わせ">
        <p>本ポリシーに関するお問い合わせは、トップページのお問い合わせ欄よりお願いします。</p>
      </LegalSection>
    </LegalLayout>
  );
}
