import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  useActions,
  useComments,
  useSearchSuggestions,
  useSearchTerms,
  useShowComments,
  useVideo,
  useVideoId,
  useVideoUrl,
} from "@/lib/video-store"
import { api } from "@/utils/api"
import { MagnifyingGlassIcon, ReloadIcon } from "@radix-ui/react-icons"
import { formatDistanceStrict } from "date-fns"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  const { video } = useVideo()
  const showComments = useShowComments()

  return (
    <div className="relative flex w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center justify-between py-8 md:gap-16">
        <Header />

        <main className="flex w-11/12 max-w-sm flex-col justify-center gap-8 py-8 md:w-screen md:max-w-2xl md:py-0 lg:max-w-2xl">
          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col items-center gap-6">
              <Video />
              {video && (
                <>
                  <Separator />
                  <SearchComments />
                </>
              )}
            </div>
            {video && <SearchSuggestions />}
          </div>

          {showComments && <Comments />}
        </main>

        {video && <Footer />}
      </div>
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center justify-start">
      <p className="relative z-20 bg-gradient-to-b from-gray-800 to-gray-800 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-4xl">
        search
        <span className="mx-[2px] rounded-md bg-gray-800 px-2 text-white">
          comments
        </span>
        <span className="text-2xl">.com</span>
      </p>
    </header>
  )
}

function Footer() {
  return (
    <footer>
      <Link href="https://ko-fi.com/danielmarques" target="_blank">
        <Image
          src="/buy-me-a-coffee.jpg"
          alt="Buy me a coffee"
          width={220}
          height={80}
        />
      </Link>
    </footer>
  )
}

function Video() {
  const { video, isLoadingVideo } = useVideo()
  const videoUrl = useVideoUrl()
  const videoActions = useActions()
  const videoId = useVideoId()
  const utils = api.useUtils()

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg">
      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Video URL"
            value={videoUrl}
            onChange={(e) => videoActions.setVideoUrl(e.target.value)}
          />

          <div
            className="absolute right-0 top-0 rounded-md bg-gray-100 hover:cursor-pointer hover:bg-gray-200 md:bg-inherit"
            onClick={async () => {
              await utils.videoRouter.fetchVideoInfo.fetch({ videoId })
            }}
          >
            {isLoadingVideo ? (
              <ReloadIcon className="m-2.5 h-4 w-4 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="m-2.5 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {!isLoadingVideo && video && (
        <div className="w-full">
          <Link href={video?.videoUrl ?? ""} target="_blank">
            <div className="flex gap-3">
              <div>
                <Image
                  className="rounded-xl"
                  src={video?.thumbnail ?? ""}
                  alt="video thumbnail"
                  width={200}
                  height={112}
                />
              </div>

              <div className="flex w-80 flex-col gap-2 md:w-96">
                <p className="line-clamp-2 text-sm font-semibold">
                  {video?.title}
                </p>

                <div className="flex flex-col gap-1">
                  <span className="text-xs">{video?.channelName}</span>

                  <div className="text-xs">
                    <span>{video?.viewCount}</span> views •{" "}
                    <span>{video?.likeCount}</span> likes •{" "}
                    <span>{video?.commentCount} comments</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

function SearchComments() {
  const { isLoadingComments } = useComments()
  const searchTerms = useSearchTerms()
  const videoActions = useActions()
  const videoId = useVideoId()
  const utils = api.useUtils()

  return (
    <div className="flex w-full flex-col items-center gap-4 md:flex-row md:gap-2">
      <div className="relative w-full">
        <Input
          className="w-full bg-white"
          type="text"
          onChange={(e) => videoActions.setSearchTerms(e.target.value)}
          placeholder="Search the comments"
          value={searchTerms}
        />

        <div
          className="absolute right-0 top-0 rounded-md bg-gray-100 hover:cursor-pointer hover:bg-gray-200 md:bg-inherit"
          onClick={async () => {
            await utils.videoRouter.fetchComments.fetch({
              videoId,
              searchTerms,
            })

            videoActions.setShowComments(true)
          }}
        >
          {isLoadingComments ? (
            <ReloadIcon className="m-2.5 h-4 w-4 animate-spin" />
          ) : (
            <MagnifyingGlassIcon className="m-2.5 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  )
}

function SearchSuggestions() {
  const searchSuggestions = useSearchSuggestions()
  const searchTerms = useSearchTerms()
  const videoId = useVideoId()
  const videoActions = useActions()
  const utils = api.useUtils()

  return (
    <div className="flex flex-wrap items-center gap-3">
      {searchSuggestions.map(({ suggestion, selected }) => (
        <Button
          className={`h-8 rounded-lg ${selected ? "bg-black text-white hover:bg-primary/90" : "bg-zinc-100"} text-sm font-semibold hover:bg-zinc-200`}
          key={suggestion}
          variant="secondary"
          onClick={async () => {
            await utils.videoRouter.fetchComments.fetch({
              videoId,
              searchTerms,
            })

            videoActions.setShowComments(true)

            const newSuggestions = searchSuggestions.map((s) => {
              s.suggestion === suggestion &&
                videoActions.setSearchTerms(s.selected ? "" : s.suggestion)

              return {
                ...s,
                selected: s.suggestion === suggestion && !s.selected,
              }
            })

            videoActions.setSearchSuggestions(newSuggestions)
          }}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  )
}

function Comments() {
  const { comments } = useComments()
  const searchTerms = useSearchTerms()

  return (
    <div className="flex flex-col gap-6">
      <span className="text-lg font-medium">
        Comments found ({comments?.length})
      </span>

      <div className="flex flex-col gap-8">
        {comments?.map((comment, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex items-start">
              <Image
                className="rounded-full"
                src={comment.author.photo}
                width={40}
                height={40}
                alt="Comments"
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2">
                <span>{comment.author.name}</span>
                <span className="text-xs">
                  {formatDistanceStrict(
                    new Date(comment.comment.date),
                    new Date(),
                    { addSuffix: true },
                  )}
                </span>
              </div>
              <div>
                <HighlightText
                  text={comment.comment.content}
                  wordsToHighlight={searchTerms}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <p>
                  {comment.comment.likes}{" "}
                  {parseInt(comment.comment.likes) === 1 ? "like" : "likes"}
                </p>
                |<p>{comment.comment.repliesCount} replies</p>|
                <Link target="_blank" href={comment.comment.viewCommentUrl}>
                  Go to comment
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const highlightText = (text: string, phrase: string) => {
  if (!phrase) return text
  const words = phrase.split(" ").filter((word) => word)
  const regex = new RegExp(`\\b(${words.join("|")})\\b`, "gi")

  return text.split(regex).map((part, index) =>
    words.includes(part.toLowerCase()) ? (
      <span key={index} className="rounded-md bg-yellow-300 p-1 font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

function HighlightText({
  text,
  wordsToHighlight,
}: {
  text: string
  wordsToHighlight: string
}) {
  return <div>{highlightText(text, wordsToHighlight)}</div>
}
