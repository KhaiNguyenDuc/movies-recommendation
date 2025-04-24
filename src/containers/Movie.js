import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import styled from 'styled-components';
import queryString from 'query-string';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import history from '../history';
import LazyLoad from 'react-lazyload';
import ModalVideo from 'react-modal-video';
import { Element, animateScroll as scroll } from 'react-scroll';
import {
  getMovie,
  getRecommendations,
  clearRecommendations,
  clearMovie,
} from '../actions';
import Rating from '../components/Rating';
import NotFound from '../components/NotFound';
import Header from '../components/Header';
import Cast from '../components/Cast';
import Loader from '../components/Loader';
import MoviesList from '../components/MoviesList';
import Button from '../components/Button';
import NothingSvg from '../svg/nothing.svg';
import Loading from '../components/Loading';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`;

const MovieWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 120rem;
  margin: 0 auto;
  margin-bottom: 7rem;
  transition: all 600ms cubic-bezier(0.215, 0.61, 0.355, 1);

  @media ${(props) => props.theme.mediaQueries.largest} {
    max-width: 105rem;
  }

  @media ${(props) => props.theme.mediaQueries.larger} {
    max-width: 110rem;
    margin-bottom: 6rem;
  }

  @media ${(props) => props.theme.mediaQueries.large} {
    max-width: 110rem;
    margin-bottom: 5rem;
  }

  @media ${(props) => props.theme.mediaQueries.medium} {
    flex-direction: column;
    margin-bottom: 5rem;
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  display: block;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary-light);
  text-transform: uppercase;
  padding: 0.5rem 0rem;
  transition: all 300ms cubic-bezier(0.075, 0.82, 0.165, 1);

  &:not(:last-child) {
    margin-right: 2rem;
  }

  &:hover {
    transform: translateY(-3px);
  }

  &:active {
    transform: translateY(2px);
  }
`;

const LinksWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
`;

const MovieDetails = styled.div`
  width: 100%;
  max-width: 60%;
  padding: 4rem;
  flex: 1 1 60%;

  @media ${(props) => props.theme.mediaQueries.largest} {
    padding: 3rem;
  }

  @media ${(props) => props.theme.mediaQueries.large} {
    padding: 2rem;
  }

  @media ${(props) => props.theme.mediaQueries.smaller} {
    padding: 1rem;
  }

  @media ${(props) => props.theme.mediaQueries.smallest} {
    padding: 0rem;
  }

  @media ${(props) => props.theme.mediaQueries.medium} {
    max-width: 100%;
    flex: 1 1 100%;
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  max-width: 40%;
  flex: 1 1 40%;
  align-items: center;
  justify-content: center;
  display: flex;
  padding: 4rem;

  @media ${(props) => props.theme.mediaQueries.largest} {
    padding: 3rem;
  }

  @media ${(props) => props.theme.mediaQueries.large} {
    padding: 2rem;
  }

  @media ${(props) => props.theme.mediaQueries.smaller} {
    margin-bottom: 2rem;
  }

  @media ${(props) => props.theme.mediaQueries.medium} {
    max-width: 60%;
    flex: 1 1 60%;
  }
`;

const MovieImg = styled.img`
  max-height: 100%;
  height: ${(props) => (props.error ? '25rem' : 'auto')};
  object-fit: ${(props) => (props.error ? 'contain' : 'cover')};
  padding: ${(props) => (props.error ? '2rem' : '')};
  max-width: 100%;
  border-radius: 0.8rem;
  box-shadow: ${(props) =>
    props.error ? 'none' : '0rem 2rem 5rem var(--shadow-color-dark)'};
`;

const ImgLoading = styled.div`
  width: 100%;
  max-width: 40%;
  flex: 1 1 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  transition: all 100ms cubic-bezier(0.645, 0.045, 0.355, 1);

  @media ${(props) => props.theme.mediaQueries.smaller} {
    height: 28rem;
  }
`;

const HeaderWrapper = styled.div`
  margin-bottom: 2rem;
`;

const Heading = styled.h3`
  color: var(--color-primary-dark);
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 1rem;
  font-size: 1.4rem;

  @media ${(props) => props.theme.mediaQueries.medium} {
    font-size: 1.2rem;
  }
`;

const DetailsWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5rem;
`;

const RatingsWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-right: auto;
`;

const RatingNumber = styled.p`
  font-size: 1.3rem;
  line-height: 1;
  font-weight: 700;
  color: var(--color-primary);
`;

const Info = styled.div`
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  color: var(--color-primary-lighter);
  font-size: 1.3rem;
`;

const Text = styled.p`
  font-size: 1.4rem;
  line-height: 1.8;
  color: var(--link-color);
  font-weight: 500;
  margin-bottom: 3rem;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  align-items: center;

  @media ${(props) => props.theme.mediaQueries.small} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const LeftButtons = styled.div`
  margin-right: auto;
  display: flex;

  @media ${(props) => props.theme.mediaQueries.small} {
    margin-bottom: 2rem;
  }

  & > *:not(:last-child) {
    margin-right: 2rem;

    @media ${(props) => props.theme.mediaQueries.large} {
      margin-right: 1rem;
    }
  }
`;

const AWrapper = styled.a`
  text-decoration: none;
`;

//Movie Component
const Movie = ({
  location,
  geral,
  match,
  movie,
  getMovie,
  clearMovie,
  recommended,
  getRecommendations,
  clearRecommendations,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [modalOpened, setmodalOpened] = useState(false);
  const { secure_base_url } = geral.base.images;
  const params = queryString.parse(location.search);
  const [modifiedRating, setModifiedRating] = useState({
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
  });
  // Fetch movie id when id on the url changes
  useEffect(() => {
    scroll.scrollToTop({
      smooth: true,
      delay: 500,
    });

    getMovie(match.params.id);
    getRecommendations(match.params.id, params.page);

    return () => {
      clearMovie();
      clearRecommendations();
      setLoaded(false);
    };
  }, [match.params.id]);

  useEffect(() => {
    const fetchRatingFromFirestore = async () => {
      if (movie.id) {
        try {
          // Get customerId from localStorage (get user.uuid)
          const user = JSON.parse(localStorage.getItem("user"));
          const customerEmail = user ? user.email : null;

          if (!customerEmail) {
            console.error("User not found in localStorage");
            return;
          }

          // Firestore document reference for the customer's movie ratings
          const ratingsRef = doc(db, "movieRatings", customerEmail);

          // Fetch the current ratings document for the customer
          const ratingsSnap = await getDoc(ratingsRef);

          if (ratingsSnap.exists()) {
            // Get movie ratings data
            const ratingsData = ratingsSnap.data();
            
            // Find the rating for the current movie
            const existingRating = ratingsData.movieRatings.find(
              (item) => item.id === movie.id
            );

            if (existingRating) {
              // If the movie has a saved rating, use it
              setModifiedRating({
                vote_average: existingRating.rating,
              });
              
            } else {
              // If no rating exists for this movie, set default values
              setModifiedRating({
                vote_average: 0,
              });
            }
          } else {
            // If no ratings document exists for the customer, set default values
            setModifiedRating({
              vote_average: 0,
            });
          }
        } catch (error) {
          console.error("Error fetching rating from Firestore:", error);
        }
      }
    };

    fetchRatingFromFirestore();
  }, [movie.id]); // Runs only when movie.id changes
  
  // If loading
  if (movie.loading) {
    return <Loader />;
  }

  if (movie.status_code) {
    history.push(process.env.PUBLIC_URL + '/404');
  }

  return (
    <Wrapper>
      <Helmet>
        <title>{`${movie.title} - Movie Library`}</title>
      </Helmet>
      <LazyLoad height={500}>
        <MovieWrapper>
          {!loaded ? (
            <ImgLoading>
              <Loading />
            </ImgLoading>
          ) : null}
          <ImageWrapper style={!loaded ? { display: 'none' } : {}}>
            <MovieImg
              error={error ? 1 : 0}
              src={`${secure_base_url}w780${movie.poster_path}`}
              onLoad={() => setLoaded(true)}
              // If no image, error will occurr, we set error to true
              // And only change the src to the nothing svg if it isn't already, to avoid infinite callback
              onError={(e) => {
                setError(true);
                if (e.target.src !== `${NothingSvg}`) {
                  e.target.src = `${NothingSvg}`;
                }
              }}
            />
          </ImageWrapper>
          <MovieDetails>
            <HeaderWrapper>
              <Header size="2" title={movie.title} subtitle={movie.tagline} />
            </HeaderWrapper>
            <DetailsWrapper>
              <RatingsWrapper>

                
      <Rating number={movie.vote_average / 2} />
      <RatingNumber>{movie.vote_average}</RatingNumber>
              </RatingsWrapper>

   

              <Info>
                {renderInfo(
                  movie.spoken_languages,
                  movie.runtime,
                  splitYear(movie.release_date)
                )}
              </Info>
              
            </DetailsWrapper>
       
            <Heading>The Genres</Heading>
            <LinksWrapper>{renderGenres(movie.genres)}</LinksWrapper>
             {/* Insert the rating input component */}
             <Heading>Your rating</Heading>
            <DetailsWrapper>

<RatingsWrapper>

<Rating number={modifiedRating.vote_average} />
<RatingNumber>{modifiedRating.vote_average}</RatingNumber>
</RatingsWrapper>
            </DetailsWrapper> 
            
            <DetailsWrapper>
            <MovieRating
              modifiedRating={modifiedRating}
              setModifiedRating={setModifiedRating}
              movieId={movie.id}
            />
              </DetailsWrapper>           


            
            <Heading>The Synopsis</Heading>
            <Text>
              {movie.overview
                ? movie.overview
                : 'There is no synopsis available...'}
            </Text>
            <Heading>The Cast</Heading>
            <Cast cast={movie.cast} baseUrl={secure_base_url} />
            <ButtonsWrapper>
              <LeftButtons>
                {renderWebsite(movie.homepage)}
                {renderImdb(movie.imdb_id)}
                {renderTrailer(
                  movie.videos.results,
                  modalOpened,
                  setmodalOpened
                )}
              </LeftButtons>
              {renderBack()}
            </ButtonsWrapper>
          </MovieDetails>
        </MovieWrapper>
      </LazyLoad>
      <Header title="Recommended" subtitle="movies" />
      {renderRecommended(recommended, secure_base_url)}
    </Wrapper>
  );
};

//Render the back button if user was pushed into page
function renderBack() {
  if (history.action === 'PUSH') {
    return (
      <div onClick={history.goBack}>
        <Button title="Back" solid left icon="arrow-left" />
      </div>
    );
  }
}

// Render Personal Website button
function renderWebsite(link) {
  if (!link) {
    return null;
  }
  return (
    <AWrapper target="_blank" href={link}>
      <Button title="Website" icon="link" />
    </AWrapper>
  );
}

// Render IMDB button
function renderImdb(id) {
  if (!id) {
    return null;
  }
  return (
    <AWrapper target="_blank" href={`https://www.imdb.com/title/${id}`}>
      <Button title="IMDB" icon={['fab', 'imdb']} />
    </AWrapper>
  );
}

// Render Trailer button. On click triggers state to open modal of trailer
function renderTrailer(videos, modalOpened, setmodalOpened) {
  if (videos.length === 0) {
    return;
  }
  const { key } = videos.find(
    (video) => video.type === 'Trailer' && video.site === 'YouTube'
  );
  return (
    <React.Fragment>
      <div onClick={() => setmodalOpened(true)}>
        <Button title="Trailer" icon="play" />
      </div>
      <ModalVideo
        channel="youtube"
        isOpen={modalOpened}
        videoId={key}
        onClose={() => setmodalOpened(false)}
      />
    </React.Fragment>
  );
}

// Function to get the year only from the date
function splitYear(date) {
  if (!date) {
    return;
  }
  const [year] = date.split('-');
  return year;
}

// Render info of movie
function renderInfo(languages, time, data) {
  const info = [];
  if (languages.length !== 0) {
    info.push(languages[0].name);
  }
  info.push(time, data);
  return info
    .filter((el) => el !== null)
    .map((el) => (typeof el === 'number' ? `${el} min.` : el))
    .map((el, i, array) => (i !== array.length - 1 ? `${el} / ` : el));
}

// Render recommended movies
function renderRecommended(recommended, base_url) {
  if (recommended.loading) {
    return <Loader />;
  } else if (recommended.total_results === 0) {
    return (
      <NotFound
        title="Sorry!"
        subtitle={`There are no recommended movies...`}
      />
    );
  } else {
    return (
      <Element name="scroll-to-element">
        <MoviesList movies={recommended} baseUrl={base_url} />;
      </Element>
    );
  }
}

// Render Genres with links
function renderGenres(genres) {
  return genres.map((genre) => (
    <StyledLink
      to={`${process.env.PUBLIC_URL}/genres/${genre.name}`}
      key={genre.id}
    >
      <FontAwesomeIcon
        icon="dot-circle"
        size="1x"
        style={{ marginRight: '5px' }}
      />
      {genre.name}
    </StyledLink>
  ));
}

// Get state from store and pass as props to component
const mapStateToProps = ({ movie, geral, recommended }) => ({
  movie,
  geral,
  recommended,
});

export default connect(mapStateToProps, {
  getMovie,
  clearMovie,
  getRecommendations,
  clearRecommendations,
})(Movie);

const MovieRating = ({ modifiedRating, setModifiedRating, movieId }) => {
  const [userRating, setUserRating] = useState(null); // User's selected rating
  const [savedRatings, setSavedRatings] = useState(() => {
    // Load saved ratings from localStorage when the component mounts
    const storedRatings = JSON.parse(localStorage.getItem("movieRatings")) || [];
    return storedRatings;
  });

  const handleRatingChange = (rating) => {
    if (rating >= 1 && rating <= 5) {
      setUserRating(rating); // Only update the local state, NOT localStorage yet
    }
  };

  const submitRating = async () => {
    if (userRating) {
      try {
        // Get customerId from localStorage (get user.uuid)
        const user = JSON.parse(localStorage.getItem("user"));
        const customerEmail = user ? user.email : null;
  
        if (!customerEmail) {
          console.error("User not found in localStorage");
          return;
        }
  
        // Firestore document reference
        const ratingsRef = doc(db, "movieRatings", customerEmail);
  
        // Fetch the current ratings document for the customer
        const ratingsSnap = await getDoc(ratingsRef);
  
        let updatedRatings = [];
  
        if (ratingsSnap.exists()) {
          // If customer already has ratings, update it
          const ratingsData = ratingsSnap.data();
          
          // Check if the movie already has a rating
          const existingIndex = ratingsData.movieRatings.findIndex(
            (item) => item.id === movieId
          );
  
          if (existingIndex !== -1) {
            // If rating exists, update the rating
            ratingsData.movieRatings[existingIndex].rating = userRating;
          } else {
            // If rating does not exist, add a new entry
            ratingsData.movieRatings.push({ id: movieId, rating: userRating });
          }
  
          updatedRatings = ratingsData.movieRatings;
        } else {
          // If no ratings exist for the customer, create a new entry
          updatedRatings = [{ id: movieId, rating: userRating }];
        }
  
        // Save the updated ratings in Firestore
        await setDoc(ratingsRef, { movieRatings: updatedRatings }, { merge: true });
  
        // Update state to reflect new ratings
        setSavedRatings(updatedRatings);
  
        // Update the movie's average rating and vote count (if applicable)
        const updatedVoteAverage = userRating;
        const updatedVoteCount = modifiedRating.vote_count + 1;
  
        setModifiedRating({
          vote_average: updatedVoteAverage,
          vote_count: updatedVoteCount,
        });
        localStorage.setItem("userRatings", updatedRatings)
        console.log("Updated ratings in Firestore:", updatedRatings);
      } catch (error) {
        console.error("Error updating Firestore: ", error);
      }
    }
  };
  
  return (
    <div>
      <h3>Rate this movie</h3>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onClick={() => handleRatingChange(rating)}
          style={{
            backgroundColor: userRating === rating ? 'yellow' : 'gray',
            padding: '0.5rem 1rem',
            marginBottom: '3rem',
            margin: '0.2rem',
            cursor: 'pointer',
          }}
        >
          {rating}
        </button>
      ))}
      <button
        onClick={submitRating}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          backgroundColor: 'green',
          color: 'white',
        }}
      >
        Submit Rating
      </button>
    </div>
  );
};  