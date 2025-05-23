import { Header } from "@/components/header"
import { SearchHistorySidebar } from "@/components/search-history-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCommentsInfiniteScrolling } from "@/hooks/use-comments-infinite-scrolling"
import { captureEvent } from "@/lib/analytics"
import {
  useActions,
  useCommentId,
  useComments,
  useReplies,
  useSearchSuggestions,
  useSearchTerms,
  useVideo,
  useVideoId,
  useVideoUrl,
} from "@/lib/video-store"
import { type Comment } from "@/server/api/use-cases/fetch-comments"
import { api } from "@/utils/api"
import { MagnifyingGlassIcon, ReloadIcon } from "@radix-ui/react-icons"
import { useSession } from "@supabase/auth-helpers-react"
import { formatDistanceStrict } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

function DevModeQuickVideoButton() {
  const utils = api.useUtils()
  const videoActions = useActions()

  async function handleQuickVideoClick() {
    videoActions.setVideoUrl("https://www.youtube.com/watch?v=0e3GPea1Tyg")

    await utils.videoContentRouter.getVideoInfo.fetch({
      videoId: "0e3GPea1Tyg",
    })
  }

  return (
    <Button variant="outline" onClick={handleQuickVideoClick}>
      Quick video
    </Button>
  )
}

export default function Home() {
  const { video } = useVideo()
  const { comments, hasNextPage, isFetchingNextPage } = useComments()
  const { commentsInfiniteScrollingObserverTarget } =
    useCommentsInfiniteScrolling()

  const showComments = Boolean(comments?.length) && comments

  const showDevModeQuickVideoButton =
    process.env.NODE_ENV === "development" && !video

  return (
    <div className="flex">
      <SearchHistorySidebar />

      <div className="mx-auto">
        <Header />

        <div className="relative flex w-full items-center justify-center">
          <div className="flex flex-col items-center justify-between py-8 md:gap-16">
            <main className="flex w-11/12 max-w-sm flex-col justify-center gap-8 py-8 md:w-screen md:max-w-2xl md:py-0 lg:max-w-2xl">
              <div className="flex w-full flex-col gap-6">
                <div className="flex flex-col items-center gap-6">
                  <Video />

                  {showDevModeQuickVideoButton && <DevModeQuickVideoButton />}

                  {video && (
                    <>
                      <Separator />
                      <SearchComments />
                    </>
                  )}
                </div>
                {video && <SearchSuggestions />}
              </div>

              {showComments && (
                <>
                  <Comments comments={comments} />

                  {hasNextPage && (
                    <div
                      ref={commentsInfiniteScrollingObserverTarget}
                      className="h-10 w-full"
                    >
                      {isFetchingNextPage && (
                        <div className="flex justify-center">
                          <ReloadIcon className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

function Video() {
  const { video, isLoadingVideo } = useVideo()
  const videoUrl = useVideoUrl()
  const videoActions = useActions()
  const videoId = useVideoId()
  const utils = api.useUtils()

  const videoUrlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    videoUrlInputRef.current?.focus()
  }, [])

  async function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      await utils.videoContentRouter.getVideoInfo.fetch({ videoId })
    }
  }

  async function handleVideoClick() {
    await utils.videoContentRouter.getVideoInfo.fetch({ videoId })
  }

  const showVideoInfo = video && !isLoadingVideo

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg">
      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
        <div className="relative w-full min-w-72">
          <Input
            type="text"
            placeholder="YouTube Video URL"
            onKeyDown={handleKeyDown}
            value={videoUrl}
            onChange={(e) => videoActions.setVideoUrl(e.target.value)}
            ref={videoUrlInputRef}
          />

          <div
            className="absolute right-0 top-0 rounded-md hover:cursor-pointer hover:bg-muted"
            onClick={handleVideoClick}
          >
            {isLoadingVideo ? (
              <ReloadIcon className="m-2.5 h-4 w-4 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="m-2.5 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {showVideoInfo && (
        <div className="w-full">
          <Link
            href={video?.videoUrl ?? ""}
            target="_blank"
            title={video?.title}
          >
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
  const { video } = useVideo()
  const { isLoadingComments } = useComments()
  const searchTerms = useSearchTerms()
  const videoActions = useActions()
  const videoId = useVideoId()
  const videoUrl = useVideoUrl()
  const utils = api.useUtils()
  const { mutate } = api.searchRouter.saveSearch.useMutation()
  const session = useSession()

  const searchCommentsInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchCommentsInputRef.current?.focus()
  }, [])

  async function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      await handleCommentClick()
    }
  }

  async function handleCommentClick() {
    if (process.env.NODE_ENV === "production" && searchTerms === "") return

    session?.user.email &&
      mutate({
        query: searchTerms,
        videoTitle: video?.title ?? "",
        videoUrl,
      })

    await utils.videoContentRouter.getVideoComments.fetchInfinite({
      videoId,
      searchTerms,
    })

    captureEvent({
      event: "Video + search term",
      user: {},
      properties: {
        videoTitle: video?.title,
        videoUrl,
        searchTerms,
      },
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 md:flex-row md:gap-2">
      <div className="relative w-full">
        <Input
          className="w-full"
          type="text"
          onChange={(e) => videoActions.setSearchTerms(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search the comments"
          value={searchTerms}
          ref={searchCommentsInputRef}
        />

        <div
          className="absolute right-0 top-0 rounded-md hover:cursor-pointer hover:bg-muted"
          onClick={handleCommentClick}
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
  const { video } = useVideo()
  const searchSuggestions = useSearchSuggestions()
  const searchTerms = useSearchTerms()
  const videoId = useVideoId()
  const videoUrl = useVideoUrl()
  const videoActions = useActions()
  const utils = api.useUtils()

  async function handleSuggestionClick(suggestion: string) {
    await utils.videoContentRouter.getVideoComments.fetch({
      videoId,
      searchTerms: suggestion,
    })

    const newSuggestions = searchSuggestions.map((s) => {
      s.suggestion === suggestion &&
        videoActions.setSearchTerms(s.selected ? "" : s.suggestion)

      return {
        ...s,
        selected: s.suggestion === suggestion && !s.selected,
      }
    })

    videoActions.setSearchSuggestions(newSuggestions)

    captureEvent({
      event: "Search suggestions",
      user: {},
      properties: {
        videoTitle: video?.title,
        videoUrl,
        searchTerms,
        suggestion,
      },
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {searchSuggestions.map(({ suggestion, selected }) => (
        <Button
          className={`h-8 rounded-lg ${selected && "bg-accent-foreground text-background hover:bg-accent-foreground"} text-sm font-semibold`}
          key={suggestion}
          variant="secondary"
          onClick={() => handleSuggestionClick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  )
}

function Comments({ comments }: { comments: Comment[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8">
        {comments?.map((comment) => (
          <Comment key={comment.comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}

function Comment({ comment }: { comment: Comment }) {
  const { video } = useVideo()
  const videoUrl = useVideoUrl()
  const { replies } = useReplies()
  const searchTerms = useSearchTerms()
  const videoActions = useActions()
  const [showReplies, setShowReplies] = useState(false)
  const commentId = useCommentId()
  const utils = api.useUtils()

  async function handleShowRepliesClick() {
    videoActions.setcommentId(comment.comment.id)
    setShowReplies(!showReplies)

    if (showReplies) return

    await utils.videoContentRouter.getVideoComments.fetch({
      commentId: [comment.comment.id],
      searchTerms: "",
      includeReplies: true,
    })

    captureEvent({
      event: "User clicked to Show replies",
      user: {},
      properties: {
        videoTitle: video?.title,
        videoUrl,
        searchTerms,
        commentId: comment.comment.id,
      },
    })
  }

  const commentPostedDate = formatDistanceStrict(
    new Date(comment.comment.date),
    new Date(),
    { addSuffix: true },
  )

  const showRepliesButton = comment.comment.repliesCount > 0
  const showCommentReplies = comment.comment.id === commentId && showReplies

  return (
    <div>
      <div className="flex gap-4">
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
            <span className="text-xs">{commentPostedDate}</span>
          </div>

          <div>
            <HighlightText
              text={comment.comment.content}
              wordsToHighlight={searchTerms}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
            <p>
              {comment.comment.likes}{" "}
              {parseInt(comment.comment.likes) === 1 ? "like" : "likes"}
            </p>
            |
            <Link
              target="_blank"
              href={comment.comment.viewCommentUrl}
              title="Go to comment"
            >
              Go to comment
            </Link>
            {showRepliesButton && (
              <>
                |
                <div
                  className="hover:cursor-pointer"
                  onClick={handleShowRepliesClick}
                >
                  <p>
                    {showReplies ? "Hide" : "Show"} replies (
                    {comment.comment.repliesCount})
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showCommentReplies && (
        <div className="ml-14 mt-6">
          <Comments comments={replies ?? []} />
        </div>
      )}
    </div>
  )
}

function highlightText(text: string, phrase: string) {
  if (!phrase) return text
  const words = phrase.split(" ").filter((word) => word)
  const regex = new RegExp(`(${words.join("|")})`, "gi")

  return text.split(regex).map((part, index) => {
    const lowerCasePart = part.toLowerCase()
    const lowerCaseWords = words.map((word) => word.toLowerCase())
    return lowerCaseWords.includes(lowerCasePart) ? (
      <span
        key={index}
        className="rounded-md bg-yellow-300 p-1 font-semibold dark:bg-yellow-700"
      >
        {part}
      </span>
    ) : (
      part
    )
  })
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
